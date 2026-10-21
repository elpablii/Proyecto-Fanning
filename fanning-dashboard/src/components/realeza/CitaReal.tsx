import Link from 'next/link';
import { Quote } from 'lucide-react';
import type { CitaArtista } from '@/lib/realeza';
import { minuto } from '@/lib/formato';

// Dónde se dice: "Barbie · 13:36" o "Euphoria · S01E01 · 0:41".
export function lugarCita(cita: CitaArtista): string {
  return [cita.titulo, cita.episodio, cita.segundo !== undefined ? minuto(cita.segundo) : null].filter(Boolean).join(' · ');
}

// Una línea de diálogo del artista, verificada contra los subtítulos (ver scripts/metricas/citas.py).
export default function CitaReal({ cita, href, color, grande = false }: {
  cita: CitaArtista;
  href?: string;          // la ficha del título
  color: string;          // clase de color del grupo (comillas y personaje)
  grande?: boolean;
}) {
  const lugar = lugarCita(cita);
  return (
    <figure className={grande ? 'relative max-w-3xl mx-auto text-center px-6' : 'relative'}>
      {grande && <Quote aria-hidden size={40} className={`mx-auto mb-3 opacity-40 ${color}`} />}
      <blockquote lang="en" className={grande
        ? 'text-2xl sm:text-3xl md:text-4xl font-semibold italic text-white leading-snug'
        : 'text-sm italic text-gray-200 leading-snug line-clamp-2'}>
        “{cita.texto}”
      </blockquote>
      <figcaption className={grande ? 'mt-4 text-sm text-gray-400' : 'mt-1 text-xs text-gray-500'}>
        — <span className={`font-semibold ${color}`}>{cita.personaje}</span>
        {', en '}
        {href ? <Link href={href} className="hover:text-white underline underline-offset-2 decoration-white/20">{lugar}</Link> : lugar}
      </figcaption>
    </figure>
  );
}
