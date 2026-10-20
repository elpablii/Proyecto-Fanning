"use client";

import { useSyncExternalStore } from 'react';
import { Clock } from 'lucide-react';

// Fecha y hora de quien mira la página, al segundo. En el build no hay hora (la página es estática),
// así que ahí se deja el espacio vacío y el navegador la pone al cargar.

const FECHA = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const HORA = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });

function suscribir(aviso: () => void) {
  const id = setInterval(aviso, 1000);
  return () => clearInterval(id);
}
// En segundos: el mismo valor durante todo el segundo, para no volver a pintar de más.
const ahora = () => Math.floor(Date.now() / 1000);
const enBuild = () => null;

export default function RelojActual({ className = '' }: { className?: string }) {
  const segundos = useSyncExternalStore(suscribir, ahora, enBuild);
  const momento = segundos === null ? null : new Date(segundos * 1000);
  const fecha = momento ? FECHA.format(momento) : '';

  return (
    <div className={`inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-gray-950/60 backdrop-blur-md px-4 py-2.5 shadow-lg resplandor-latiendo ${className}`}>
      <Clock size={18} className="text-purple-300 shrink-0" aria-hidden />
      <div className="flex flex-col leading-tight min-w-44">
        <time dateTime={momento?.toISOString()} className="font-mono text-xl font-bold tabular-nums text-gray-100">
          {momento ? HORA.format(momento) : '--:--:--'}
        </time>
        <span className="text-xs text-gray-400 first-letter:uppercase">{fecha || ' '}</span>
      </div>
    </div>
  );
}
