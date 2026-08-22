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
}

export default function MovieCard({ title, count, dialogues, href, posterUrl }: MovieCardProps) {
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

            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-90 transition-opacity duration-300"></div>

            <div className="absolute bottom-0 left-0 right-0 p-4">
                <h4 className="text-sm font-bold text-white leading-tight drop-shadow-md mb-1">{title}</h4>
            </div>
        </Link>
    );
}
