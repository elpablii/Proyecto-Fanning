import React, { ViewTransition } from 'react';
import { miles, porcentaje } from '@/lib/formato';
import { comprension } from '@/lib/stats';
import { tmdb } from '@/lib/tmdb';
import Link from 'next/link';
import { Crown, Film, Heart } from 'lucide-react';
import { hrefArtista, type Artista } from '@/lib/realeza';

export type ArtistaEnCarta = Pick<Artista, 'nombre' | 'foto' | 'tipo' | 'rango'>;

interface MovieCardProps {
    title: string;
    count: number;
    dialogues?: number;
    href: string;
    posterUrl?: string | null;
    level?: string;
    rating?: string;
    realeza?: ArtistaEnCarta[];
    transicion?: string;   // nombre para que el póster vuele a la ficha (ver lib/transiciones.ts)
    color?: string | null; // el color del póster: borde y brillo al pasar el mouse
}

// Insignia de la Realeza: corazón si hay un Amor Platónico, corona dorada si hay un Rey Supremo,
// corona simple para el resto. Al pasar el mouse aparecen las caras de quienes están en el elenco,
// y cada una lleva a su página (la insignia lleva a la del primero, el de rango más alto).
// Va fuera del enlace del póster: un enlace no puede ir dentro de otro.
function InsigniaRealeza({ realeza }: { realeza: ArtistaEnCarta[] }) {
    const platonico = realeza.some(a => a.rango === 'platonico');
    const supremo = realeza.some(a => a.rango === 'supremo');
    const Icono = platonico ? Heart : Crown;
    const color = platonico ? 'text-pink-400 border-pink-400/40 bg-pink-500/20'
        : supremo ? 'text-amber-300 border-amber-300/50 bg-amber-500/25'
        : 'text-amber-200 border-amber-200/30 bg-black/40';
    const nombres = realeza.map(a => a.nombre).join(', ');
    return (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
            <Link href={hrefArtista(realeza[0].nombre)} title={nombres}
                className={`flex items-center gap-1 px-1.5 py-1 rounded-md border backdrop-blur-xs shadow-sm hover:brightness-125 transition ${color}`}>
                <Icono size={14} className="latido-real" fill={platonico ? 'currentColor' : 'none'} aria-hidden />
                {realeza.length > 1 && <span className="text-[10px] font-bold">{realeza.length}</span>}
                <span className="sr-only">Con {nombres}. Ver la página de {realeza[0].nombre}</span>
            </Link>
            <span className="flex -space-x-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0 transition-all duration-300">
                {realeza.slice(0, 4).map(a => (
                    <Link key={a.nombre} href={hrefArtista(a.nombre)} title={a.nombre} className="relative hover:z-10 hover:scale-125 transition-transform">
                        <img src={a.foto ? tmdb(a.foto, 'w92') : undefined} alt={a.nombre} width={24} height={24} loading="lazy"
                            className={`w-6 h-6 rounded-full object-cover object-top border-2 bg-gray-700 ${a.rango ? (a.rango === 'platonico' ? 'border-pink-400' : 'border-amber-300') : 'border-gray-900'}`} />
                    </Link>
                ))}
                {realeza.length > 4 && (
                    <span className="w-6 h-6 rounded-full bg-gray-800 border-2 border-gray-900 text-[9px] font-bold flex items-center justify-center text-gray-300">+{realeza.length - 4}</span>
                )}
            </span>
        </div>
    );
}

// El foco de luz sigue al mouse (ver .reflejo-real en globals.css)
function moverFoco(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
}

export default function MovieCard({ title, count, dialogues, href, posterUrl, level = 'B2', rating = 'TE', realeza, transicion, color }: MovieCardProps) {
    const validDialogues = dialogues && dialogues > 0 ? dialogues : 0;
    
    const pct = comprension(validDialogues, count);
    
    // Asignar colores según nivel (MCER)
    let levelColors = "bg-gray-500/20 text-gray-300 border-gray-500/30";
    if (level) {
        const lv = level.toUpperCase();
        if (lv.includes('A1') || lv.includes('A2')) levelColors = "bg-blue-500/20 text-blue-300 border-blue-500/30";
        else if (lv.includes('B1') || lv.includes('B2')) levelColors = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
        else if (lv.includes('C1') || lv.includes('C2')) levelColors = "bg-purple-500/20 text-purple-300 border-purple-500/30";
    }
    return (
        <div className="group relative revelar hover:scale-105 transition-transform duration-300" onPointerMove={moverFoco} style={{ '--tono': color ?? 'var(--color-purple-500)' } as React.CSSProperties}>
        <Link href={href} className="relative bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg group-hover:border-(--tono) group-hover:shadow-[0_0_24px_-4px_var(--tono)] transition-[border-color,box-shadow] duration-300 cursor-pointer block">
            {posterUrl ? (
                <ViewTransition name={transicion} share="morph" default="none">
                    <img src={tmdb(posterUrl, 'w342')} alt={title} width={342} height={513} loading="lazy" decoding="async" className="w-full aspect-2/3 object-cover transition-transform duration-700 group-hover:scale-110" />
                </ViewTransition>
            ) : (
                <div className="aspect-2/3 bg-gray-800 flex flex-col items-center justify-center p-4 text-center">
                    <Film size={32} className="text-gray-600 mb-2" />
                    <span className="absolute text-gray-500 text-xs opacity-50 uppercase font-bold tracking-widest rotate-[-45deg]">POSTER</span>
                </div>
            )}

            <div className="absolute inset-0 bg-linear-to-t from-black/100 via-black/50 to-transparent opacity-90 transition-opacity duration-300"></div>
            <div aria-hidden className="absolute inset-0 pointer-events-none reflejo-real opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {level && (
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md border backdrop-blur-xs shadow-sm ${levelColors}`}>
                        {level}
                    </span>
                    {rating && (
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md border backdrop-blur-xs shadow-sm ${
                            rating === '+18' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                            rating === '+14' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                            rating === 'TE+7' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                            'bg-green-500/20 text-green-300 border-green-500/30'
                        }`}>
                            {rating}
                        </span>
                    )}
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-4">
                <h4 className="text-sm font-bold text-white leading-tight drop-shadow-md mb-2">{title}</h4>
                <div className="flex flex-col gap-1 text-[11px] text-gray-300">
                    <div className="flex justify-between items-center">
                        <span className="text-pink-400">Palabras:</span>
                        <span className="font-medium">{miles(count)}</span>
                    </div>
                    {validDialogues > 0 && (
                        <>
                            <div className="flex justify-between items-center">
                                <span className="text-emerald-400">Diálogos:</span>
                                <span className="font-medium">{miles(validDialogues)}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-gray-700/50 mt-1 pt-1">
                                <span className="text-cyan-400">Comprensión:</span>
                                <span className="font-bold text-white">{porcentaje(pct)}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Link>
        {realeza && realeza.length > 0 && <InsigniaRealeza realeza={realeza} />}
        </div>
    );
}
