/* eslint-disable @next/next/no-img-element */
import React from 'react';
import Link from 'next/link';
import { Film } from 'lucide-react';

interface MovieCardProps {
    title: string;
    count: number;
    dialogues?: number;
    href: string;
    posterUrl?: string | null;
    level?: string;
}

export default function MovieCard({ title, count, dialogues, href, posterUrl, level = 'B2' }: MovieCardProps) {
    const validDialogues = dialogues && dialogues > 0 ? dialogues : 0;
    
    let pct = 0;
    if (validDialogues > 0) {
        pct = ((validDialogues - count) / validDialogues) * 100;
        if (pct >= 99.445) pct = 100;
        pct = Math.max(0, pct);
    }
    
    // Asignar colores según nivel (MCER)
    let levelColors = "bg-gray-500/20 text-gray-300 border-gray-500/30";
    if (level) {
        const lv = level.toUpperCase();
        if (lv.includes('A1') || lv.includes('A2')) levelColors = "bg-blue-500/20 text-blue-300 border-blue-500/30";
        else if (lv.includes('B1') || lv.includes('B2')) levelColors = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
        else if (lv.includes('C1') || lv.includes('C2')) levelColors = "bg-purple-500/20 text-purple-300 border-purple-500/30";
    }
    return (
        <Link href={href} className="group relative bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg hover:border-purple-500 hover:scale-105 transition-all duration-300 cursor-pointer block">
            {posterUrl ? (
                <img src={posterUrl} alt={title} className="w-full aspect-2/3 object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
                <div className="aspect-2/3 bg-gray-800 flex flex-col items-center justify-center p-4 text-center">
                    <Film size={32} className="text-gray-600 mb-2" />
                    <span className="absolute text-gray-500 text-xs opacity-50 uppercase font-bold tracking-widest rotate-[-45deg]">POSTER</span>
                </div>
            )}

            <div className="absolute inset-0 bg-linear-to-t from-black/100 via-black/50 to-transparent opacity-90 transition-opacity duration-300"></div>

            {level && (
                <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md border backdrop-blur-xs shadow-sm ${levelColors}`}>
                        {level}
                    </span>
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-4">
                <h4 className="text-sm font-bold text-white leading-tight drop-shadow-md mb-2">{title}</h4>
                <div className="flex flex-col gap-1 text-[11px] text-gray-300">
                    <div className="flex justify-between items-center">
                        <span className="text-pink-400">Palabras:</span>
                        <span className="font-medium">{count}</span>
                    </div>
                    {validDialogues > 0 && (
                        <>
                            <div className="flex justify-between items-center">
                                <span className="text-emerald-400">Diálogos:</span>
                                <span className="font-medium">{validDialogues}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-gray-700/50 mt-1 pt-1">
                                <span className="text-cyan-400">Comprensión:</span>
                                <span className="font-bold text-white">{pct.toFixed(2)}%</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Link>
    );
}
