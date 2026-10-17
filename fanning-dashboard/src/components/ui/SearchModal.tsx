'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Film, Tv, X, Crown, Heart } from 'lucide-react';
import { TituloResumen } from '@/types/manifest';
import { miles } from '@/lib/formato';
import { tmdb } from '@/lib/tmdb';
import { grupoDe, hrefArtista, NOMBRE_RANGO, type Artista } from '@/lib/realeza';

export type ArtistaBuscable = Pick<Artista, 'nombre' | 'foto' | 'tipo' | 'rango'>;

// Minúsculas y sin tildes, para que "intensamente" encuentre "Intensamente" y "amsterdam" encuentre "Ámsterdam".
function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]+/g, ' ').trim();
}

function rutaDe(item: TituloResumen): string {
  return item.type === 'series'
    ? `/series/${encodeURIComponent(item.title)}`
    : `/peliculas/${encodeURIComponent(item.title)}`;
}

type Filtro = 'todo' | 'movie' | 'series' | 'realeza';

// Un resultado es un título o un miembro de la Realeza; los dos se recorren con las flechas.
type Resultado =
  | { tipo: 'titulo'; item: TituloResumen; via?: string }
  | { tipo: 'artista'; artista: ArtistaBuscable; titulos: number };

export default function SearchModal({ items, artistas = [], onClose }: { items: TituloResumen[]; artistas?: ArtistaBuscable[]; onClose: () => void }) {
  const router = useRouter();
  const [consulta, setConsulta] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todo');
  const [activo, setActivo] = useState(0);
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => {
    entrada.current?.focus();
  }, []);

  // Cuántos títulos tiene cada miembro de la Realeza (para mostrarlo en su resultado).
  const titulosPorArtista = useMemo(() => {
    const cuenta = new Map<string, number>();
    for (const item of items) for (const n of Object.keys(item.realeza ?? {})) cuenta.set(n, (cuenta.get(n) ?? 0) + 1);
    return cuenta;
  }, [items]);

  const resultados = useMemo((): Resultado[] => {
    const q = normalizar(consulta);
    const palabras = q.split(' ').filter(Boolean);
    const coincide = (texto: string) => palabras.every(p => normalizar(texto).includes(p));

    // La Realeza: con el filtro "Realeza" aparece entera; en "Todo", solo si se escribió algo.
    const personas: Resultado[] = filtro === 'realeza' || (filtro === 'todo' && palabras.length)
      ? artistas
        .filter(a => !palabras.length || coincide(a.nombre))
        .sort((a, b) => Number(normalizar(b.nombre).startsWith(q)) - Number(normalizar(a.nombre).startsWith(q))
          || (titulosPorArtista.get(b.nombre) ?? 0) - (titulosPorArtista.get(a.nombre) ?? 0))
        .map(a => ({ tipo: 'artista' as const, artista: a, titulos: titulosPorArtista.get(a.nombre) ?? 0 }))
      : [];
    if (filtro === 'realeza') return personas;

    const titulos = items
      .filter(item => filtro === 'todo' || item.type === filtro || (filtro === 'movie' && !item.type))
      .map(item => {
        const nombres = [item.title, ...(item.aliases || [])].map(normalizar);
        if (!palabras.length) return { r: { tipo: 'titulo' as const, item }, puntaje: 0 };
        // todas las palabras buscadas tienen que aparecer en algún nombre
        if (nombres.some(n => palabras.every(p => n.includes(p)))) {
          const empieza = nombres.some(n => n.startsWith(q));
          return { r: { tipo: 'titulo' as const, item }, puntaje: empieza ? 3 : 2 };
        }
        // o en el nombre de alguien de la Realeza que está en el título ("margot" -> Barbie)
        const via = Object.keys(item.realeza ?? {}).find(coincide);
        return via ? { r: { tipo: 'titulo' as const, item, via }, puntaje: 1 } : null;
      })
      .filter(r => r !== null)
      .sort((a, b) => b.puntaje - a.puntaje || a.r.item.title.localeCompare(b.r.item.title, 'es'))
      .map(r => r.r);
    return [...personas, ...titulos];
  }, [consulta, filtro, items, artistas, titulosPorArtista]);

  const abrir = (r: Resultado) => {
    onClose();
    router.push(r.tipo === 'artista' ? hrefArtista(r.artista.nombre) : rutaDe(r.item));
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
        aria-label="Buscar películas, series o artistas"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
          <Search size={20} className="text-gray-400 shrink-0" />
          <input
            ref={entrada}
            value={consulta}
            onChange={e => { setConsulta(e.target.value); setActivo(0); }}
            placeholder="Buscar película, serie o alguien de la Realeza…"
            className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-500 text-base"
            aria-label="Texto a buscar"
          />
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 px-4 py-2 border-b border-gray-800 text-sm">
          {([['todo', 'Todo'], ['movie', 'Películas'], ['series', 'Series'], ['realeza', 'Realeza']] as [Filtro, string][]).map(([valor, texto]) => (
            <button
              key={valor}
              onClick={() => { setFiltro(valor); setActivo(0); entrada.current?.focus(); }}
              className={`px-3 py-1 rounded-full transition ${filtro === valor ? (valor === 'realeza' ? 'bg-amber-500 text-gray-950' : 'bg-purple-600 text-white') : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >
              {texto}
            </button>
          ))}
          <span className="ml-auto text-gray-500 self-center">{miles(resultados.length)} resultados</span>
        </div>

        <ul className="max-h-[60vh] overflow-y-auto">
          {resultados.map((r, i) => {
            const clase = `w-full flex items-center gap-3 px-4 py-2 text-left transition ${i === activo ? 'bg-purple-600/20' : 'hover:bg-gray-800'}`;
            if (r.tipo === 'artista') {
              const grupo = grupoDe(r.artista);
              const rosa = grupo === 'platonicos' || grupo === 'reinas';
              const Icono = grupo === 'platonicos' ? Heart : Crown;
              return (
                <li key={`artista:${r.artista.nombre}`}>
                  <button onClick={() => abrir(r)} onMouseEnter={() => setActivo(i)} className={clase}>
                    {r.artista.foto ? (
                      <img src={tmdb(r.artista.foto, 'w92')} alt="" width={92} height={138} decoding="async" loading="lazy"
                        className={`w-10 h-10 my-2 object-cover object-top rounded-full shrink-0 border-2 ${rosa ? 'border-pink-400' : 'border-amber-300'}`} />
                    ) : (
                      <div className="w-10 h-10 my-2 rounded-full bg-gray-800 flex items-center justify-center shrink-0"><Icono size={16} className="text-gray-500" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-100 truncate">{r.artista.nombre}</p>
                      <p className="text-xs text-gray-400">
                        {r.titulos ? `${miles(r.titulos)} ${r.titulos === 1 ? 'título' : 'títulos'} en el proyecto` : 'Aún sin títulos en el proyecto'}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shrink-0 ${rosa ? 'bg-pink-500/15 text-pink-300' : 'bg-amber-500/15 text-amber-300'}`}>
                      <Icono size={12} fill={grupo === 'platonicos' ? 'currentColor' : 'none'} /> {NOMBRE_RANGO[grupo]}
                    </span>
                  </button>
                </li>
              );
            }
            const { item, via } = r;
            const alias = (item.aliases || []).filter(a => normalizar(a) !== normalizar(item.title));
            return (
              <li key={item.title}>
                <button
                  onClick={() => abrir(r)}
                  onMouseEnter={() => setActivo(i)}
                  className={clase}
                >
                  {item.posterUrl ? (
                    <img src={tmdb(item.posterUrl, 'w92')} alt="" width={92} height={138} decoding="async" className="w-10 h-14 object-cover rounded shrink-0" loading="lazy" />
                  ) : (
                    <div className="w-10 h-14 rounded bg-gray-800 flex items-center justify-center shrink-0"><Film size={16} className="text-gray-600" /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-100 truncate">{item.title}</p>
                    {via
                      ? <p className="text-xs text-amber-300/80 truncate flex items-center gap-1"><Crown size={11} /> Con {via}</p>
                      : alias.length > 0 && <p className="text-xs text-gray-500 truncate">{alias.join(' · ')}</p>}
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
            <li className="px-4 py-10 text-center text-gray-500">No hay películas, series ni artistas con ese nombre.</li>
          )}
        </ul>

        <div className="px-4 py-2 border-t border-gray-800 text-xs text-gray-500 hidden sm:flex gap-4">
          <span>↑ ↓ moverse</span><span>Enter abrir</span><span>Esc cerrar</span><span>Ctrl + K buscar desde cualquier parte</span>
        </div>
      </div>
    </div>
  );
}
