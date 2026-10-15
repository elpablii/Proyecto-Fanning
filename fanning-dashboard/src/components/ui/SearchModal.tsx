'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Film, Tv, X } from 'lucide-react';
import { TituloResumen } from '@/types/manifest';
import { miles } from '@/lib/formato';
import { tmdb } from '@/lib/tmdb';

// Minúsculas y sin tildes, para que "intensamente" encuentre "Intensamente" y "amsterdam" encuentre "Ámsterdam".
function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]+/g, ' ').trim();
}

function rutaDe(item: TituloResumen): string {
  return item.type === 'series'
    ? `/series/${encodeURIComponent(item.title)}`
    : `/peliculas/${encodeURIComponent(item.title)}`;
}

type Filtro = 'todo' | 'movie' | 'series';

export default function SearchModal({ items, onClose }: { items: TituloResumen[]; onClose: () => void }) {
  const router = useRouter();
  const [consulta, setConsulta] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todo');
  const [activo, setActivo] = useState(0);
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => {
    entrada.current?.focus();
  }, []);

  const resultados = useMemo(() => {
    const q = normalizar(consulta);
    const palabras = q.split(' ').filter(Boolean);
    return items
      .filter(item => filtro === 'todo' || item.type === filtro || (filtro === 'movie' && !item.type))
      .map(item => {
        const nombres = [item.title, ...(item.aliases || [])].map(normalizar);
        if (!palabras.length) return { item, puntaje: 0 };
        // todas las palabras buscadas tienen que aparecer en algún nombre
        const coincide = nombres.some(n => palabras.every(p => n.includes(p)));
        if (!coincide) return null;
        const empieza = nombres.some(n => n.startsWith(q));
        return { item, puntaje: empieza ? 2 : 1 };
      })
      .filter((r): r is { item: TituloResumen; puntaje: number } => r !== null)
      .sort((a, b) => b.puntaje - a.puntaje || a.item.title.localeCompare(b.item.title, 'es'))
      .map(r => r.item);
  }, [consulta, filtro, items]);

  const abrir = (item: TituloResumen) => {
    onClose();
    router.push(rutaDe(item));
  };

  const alTeclear = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActivo(i => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && resultados[activo]) {
      abrir(resultados[activo]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        onKeyDown={alTeclear}
        role="dialog"
        aria-label="Buscar películas o series"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
          <Search size={20} className="text-gray-400 shrink-0" />
          <input
            ref={entrada}
            value={consulta}
            onChange={e => { setConsulta(e.target.value); setActivo(0); }}
            placeholder="Buscar película o serie (también por su nombre en inglés)…"
            className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-500 text-base"
            aria-label="Texto a buscar"
          />
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 px-4 py-2 border-b border-gray-800 text-sm">
          {([['todo', 'Todo'], ['movie', 'Películas'], ['series', 'Series']] as [Filtro, string][]).map(([valor, texto]) => (
            <button
              key={valor}
              onClick={() => { setFiltro(valor); setActivo(0); entrada.current?.focus(); }}
              className={`px-3 py-1 rounded-full transition ${filtro === valor ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >
              {texto}
            </button>
          ))}
          <span className="ml-auto text-gray-500 self-center">{miles(resultados.length)} resultados</span>
        </div>

        <ul className="max-h-[60vh] overflow-y-auto">
          {resultados.map((item, i) => {
            const alias = (item.aliases || []).filter(a => normalizar(a) !== normalizar(item.title));
            return (
              <li key={item.title}>
                <button
                  onClick={() => abrir(item)}
                  onMouseEnter={() => setActivo(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition ${i === activo ? 'bg-purple-600/20' : 'hover:bg-gray-800'}`}
                >
                  {item.posterUrl ? (
                    <img src={tmdb(item.posterUrl, 'w92')} alt="" width={92} height={138} decoding="async" className="w-10 h-14 object-cover rounded shrink-0" loading="lazy" />
                  ) : (
                    <div className="w-10 h-14 rounded bg-gray-800 flex items-center justify-center shrink-0"><Film size={16} className="text-gray-600" /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-100 truncate">{item.title}</p>
                    {alias.length > 0 && <p className="text-xs text-gray-500 truncate">{alias.join(' · ')}</p>}
                    <p className="text-xs text-gray-400">
                      {miles(item.count)} palabras · {miles(item.dialogues)} líneas
                      {item.years && item.years.length > 0 && <> · {item.years.join(', ')}</>}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shrink-0 ${item.type === 'series' ? 'bg-pink-500/15 text-pink-300' : 'bg-blue-500/15 text-blue-300'}`}>
                    {item.type === 'series' ? <><Tv size={12} /> Serie</> : <><Film size={12} /> Película</>}
                  </span>
                </button>
              </li>
            );
          })}
          {resultados.length === 0 && (
            <li className="px-4 py-10 text-center text-gray-500">No hay películas ni series con ese nombre.</li>
          )}
        </ul>

        <div className="px-4 py-2 border-t border-gray-800 text-xs text-gray-500 hidden sm:flex gap-4">
          <span>↑ ↓ moverse</span><span>Enter abrir</span><span>Esc cerrar</span><span>Ctrl + K buscar desde cualquier parte</span>
        </div>
      </div>
    </div>
  );
}
