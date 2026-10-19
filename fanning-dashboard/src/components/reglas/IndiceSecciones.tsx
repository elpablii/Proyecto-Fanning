"use client";

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export interface Seccion {
  id: string;
  titulo: string;
}

// Índice de /reglas: columna fija en pantallas grandes y fila de botones en el celular.
// Resalta la sección que se está leyendo y muestra cuánto se lleva leído.
export default function IndiceSecciones({ secciones }: { secciones: Seccion[] }) {
  const [activa, setActiva] = useState(secciones[0]?.id);
  const [avance, setAvance] = useState(0);

  useEffect(() => {
    const observador = new IntersectionObserver(
      entradas => {
        const visible = entradas.find(e => e.isIntersecting);
        if (visible) setActiva(visible.target.id);
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    for (const s of secciones) {
      const el = document.getElementById(s.id);
      if (el) observador.observe(el);
    }
    return () => observador.disconnect();
  }, [secciones]);

  useEffect(() => {
    const medir = () => {
      const alto = document.documentElement.scrollHeight - window.innerHeight;
      setAvance(alto > 0 ? Math.min(1, window.scrollY / alto) : 0);
    };
    medir();
    window.addEventListener('scroll', medir, { passive: true });
    window.addEventListener('resize', medir);
    return () => {
      window.removeEventListener('scroll', medir);
      window.removeEventListener('resize', medir);
    };
  }, []);

  const barra = (
    <div className="h-1 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-label="Avance de lectura"
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(avance * 100)}>
      <div className="h-full bg-linear-to-r from-purple-400 to-pink-400 transition-[width] duration-150" style={{ width: `${avance * 100}%` }} />
    </div>
  );

  return (
    <nav aria-label="Índice">
      {/* Celular: fila desplazable */}
      <div className="lg:hidden sticky top-0 z-20 -mx-4 bg-gray-950/90 backdrop-blur-md border-b border-white/5">
        <div className="px-4 py-3 overflow-x-auto">
          <div className="flex gap-2 w-max">
            {secciones.map(s => (
              <a key={s.id} href={`#${s.id}`}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                  activa === s.id ? 'bg-purple-500/20 border-purple-500/40 text-purple-200' : 'border-white/10 text-gray-400'
                }`}>
                {s.titulo}
              </a>
            ))}
          </div>
        </div>
        <div className="px-4 pb-2">{barra}</div>
      </div>

      {/* Escritorio: columna fija */}
      <div className="hidden lg:block sticky top-8 space-y-4">
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">En esta página · {Math.round(avance * 100)}%</p>
          {barra}
        </div>
        <ol className="space-y-0.5 border-l border-white/10">
          {secciones.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`}
                className={`flex gap-2 -ml-px pl-4 py-1.5 text-sm border-l-2 transition-colors ${
                  activa === s.id ? 'border-purple-400 text-white font-medium' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}>
                <span className={`font-mono text-xs pt-0.5 ${activa === s.id ? 'text-purple-300' : 'text-gray-600'}`}>{String(i + 1).padStart(2, '0')}</span>
                {s.titulo}
              </a>
            </li>
          ))}
        </ol>
        <a href="#top" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowUp className="w-3.5 h-3.5" /> Volver arriba
        </a>
      </div>
    </nav>
  );
}
