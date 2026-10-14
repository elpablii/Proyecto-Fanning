"use client";

import { useEffect, useState } from 'react';

export interface Seccion {
  id: string;
  titulo: string;
}

// Índice de /reglas: columna fija en pantallas grandes y fila de botones en el celular.
// Resalta la sección que se está leyendo.
export default function IndiceSecciones({ secciones }: { secciones: Seccion[] }) {
  const [activa, setActiva] = useState(secciones[0]?.id);

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

  return (
    <nav aria-label="Índice">
      {/* Celular: fila desplazable */}
      <div className="lg:hidden sticky top-0 z-20 -mx-4 px-4 py-3 bg-[#09090b]/90 backdrop-blur-md border-b border-white/5 overflow-x-auto">
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

      {/* Escritorio: columna fija */}
      <ol className="hidden lg:block sticky top-8 space-y-1 border-l border-white/10">
        {secciones.map(s => (
          <li key={s.id}>
            <a href={`#${s.id}`}
              className={`block -ml-px pl-4 py-1.5 text-sm border-l-2 transition-colors ${
                activa === s.id ? 'border-purple-400 text-white font-medium' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}>
              {s.titulo}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
