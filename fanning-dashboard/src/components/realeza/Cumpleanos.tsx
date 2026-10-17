"use client";

import { useSyncExternalStore } from 'react';
import { Cake } from 'lucide-react';
import { cumpleHoy, type Artista } from '@/lib/realeza';

// La fecha de hoy en el navegador (no la del build), para que el cumpleaños y la Reina o Rey
// del día salgan el día que es. "sv" escribe la fecha local como 2026-10-16.
const nada = () => () => {};
const hoyLocal = () => new Date().toLocaleDateString('sv');

export function useHoy(hoyBuild: string): string {
  return useSyncExternalStore(nada, hoyLocal, () => hoyBuild);
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function fechaLarga(iso: string, conAnio = false): string {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]}${conAnio ? ` de ${a}` : ''}`;
}

export function edad(nacimiento: string, hasta: string): number {
  const [a1, m1, d1] = nacimiento.split('-').map(Number);
  const [a2, m2, d2] = hasta.split('-').map(Number);
  return a2 - a1 - (m2 < m1 || (m2 === m1 && d2 < d1) ? 1 : 0);
}

export default function Cumpleanos({ artista, hoy, className = '' }: { artista: Artista; hoy: string; className?: string }) {
  const { nacimiento, fallecimiento } = artista;
  if (!nacimiento) return null;
  const esHoy = cumpleHoy(artista, hoy);
  return (
    <p className={`flex items-center gap-1.5 ${esHoy ? 'text-pink-300 font-semibold' : 'text-gray-400'} ${className}`}>
      <Cake size={12} className="shrink-0" />
      {fallecimiento
        ? <span>{fechaLarga(nacimiento, true)} – {fechaLarga(fallecimiento, true)}</span>
        : esHoy
          ? <span>¡Hoy cumple {edad(nacimiento, hoy)} años!</span>
          : <span>{fechaLarga(nacimiento)} · {edad(nacimiento, hoy)} años</span>}
    </p>
  );
}
