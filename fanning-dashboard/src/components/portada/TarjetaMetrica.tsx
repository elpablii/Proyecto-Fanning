"use client";

import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

// El número sube hasta su valor al cargar la portada y al cambiar de ciclo.
function useContador(objetivo: number, ms = 900): number {
  const [valor, setValor] = useState(objetivo);
  const previo = useRef<number | null>(null);
  useEffect(() => {
    const desde = previo.current ?? 0;
    previo.current = objetivo;
    if (desde === objetivo) return;
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const inicio = performance.now();
    let cuadro = 0;
    const paso = (t: number) => {
      const k = quieto ? 1 : Math.min(1, (t - inicio) / ms);
      setValor(desde + (objetivo - desde) * (1 - (1 - k) ** 3));
      if (k < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [objetivo, ms]);
  return valor;
}

export interface PuntoSerie {
  etiqueta: string;    // "2025"
  valor: number | null;
  texto: string;       // el valor ya escrito, para el tooltip
}

// Colores de cada tarjeta (clases completas, para que Tailwind las encuentre).
export const TONOS = {
  azul: { icono: 'bg-blue-500/10 text-blue-400', nota: 'text-blue-300', hover: 'hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]', trazo: '#60a5fa' },
  verde: { icono: 'bg-emerald-500/10 text-emerald-400', nota: 'text-emerald-400', hover: 'hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]', trazo: '#34d399' },
  morado: { icono: 'bg-purple-500/10 text-purple-400', nota: 'text-purple-300', hover: 'hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]', trazo: '#c084fc' },
  rosa: { icono: 'bg-pink-500/10 text-pink-400', nota: 'text-pink-300', hover: 'hover:border-pink-500/40 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]', trazo: '#f472b6' },
  cian: { icono: 'bg-cyan-500/10 text-cyan-400', nota: 'text-cyan-400', hover: 'hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]', trazo: '#22d3ee' },
} as const;

const GRIS = '#4b5563';
const ALTO = 40;

// Mini gráfico de la cifra en cada ciclo. Columnas para cantidades (parten de cero); línea para
// porcentajes, que están todos cerca del 90 % y en columnas se verían iguales.
// El ciclo elegido va en el color de la tarjeta y los demás en gris; en el histórico, todos en color.
function MiniSerie({ serie, elegido, forma, trazo }: { serie: PuntoSerie[]; elegido: string | null; forma: 'barras' | 'linea'; trazo: string }) {
  const valores = serie.map(p => p.valor ?? 0);
  const ancho = 100 / serie.length;
  const colorDe = (p: PuntoSerie) => (!elegido || p.etiqueta === elegido ? trazo : GRIS);

  let puntos: { x: number; y: number }[] = [];
  if (forma === 'linea') {
    const conDato = serie.map(p => p.valor).filter((v): v is number => v !== null);
    const min = Math.min(...conDato), max = Math.max(...conDato);
    const rango = max - min || 1;
    puntos = serie.map((p, i) => ({ x: (i + 0.5) * ancho, y: p.valor === null ? NaN : 6 + (1 - (p.valor - min) / rango) * (ALTO - 12) }));
  }
  const tope = Math.max(...valores) || 1;

  return (
    <div className="mt-4">
      <svg viewBox={`0 0 100 ${ALTO}`} preserveAspectRatio="none" className="w-full h-10 overflow-visible" role="img"
        aria-label={serie.map(p => `${p.etiqueta}: ${p.texto}`).join('; ')}>
        {forma === 'linea' && (
          <polyline fill="none" stroke={trazo} strokeOpacity={0.5} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round"
            points={puntos.filter(p => !Number.isNaN(p.y)).map(p => `${p.x},${p.y}`).join(' ')} />
        )}
        {serie.map((p, i) => {
          const x = i * ancho;
          const alto = Math.max(2, ((p.valor ?? 0) / tope) * ALTO);
          return (
            <g key={p.etiqueta} className="group/punto">
              <title>{`Ciclo ${p.etiqueta}: ${p.texto}`}</title>
              {/* Zona de toque más grande que la marca */}
              <rect x={x} y={0} width={ancho} height={ALTO} fill="transparent" />
              {forma === 'barras' ? (
                <rect x={x + ancho * 0.2} y={ALTO - alto} width={ancho * 0.6} height={alto} rx={1.5}
                  fill={colorDe(p)} className="opacity-80 group-hover/punto:opacity-100 transition-opacity" />
              ) : !Number.isNaN(puntos[i].y) && (
                <circle cx={puntos[i].x} cy={puntos[i].y} r={elegido === p.etiqueta ? 4.5 : 3.5} fill={colorDe(p)}
                  stroke="#111827" strokeWidth={2} vectorEffect="non-scaling-stroke" />
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex text-[10px] text-gray-500 mt-1">
        {serie.map(p => (
          <span key={p.etiqueta} className={`flex-1 text-center ${p.etiqueta === elegido ? 'text-gray-200 font-semibold' : ''}`}>
            ’{p.etiqueta.slice(2)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TarjetaMetrica({ titulo, icono: Icono, tono, valor, formato, nota, serie, elegido, forma = 'barras' }: {
  titulo: string;
  icono: LucideIcon;
  tono: keyof typeof TONOS;
  valor: number | null;
  formato: (n: number | null) => string;
  nota: string;
  serie?: PuntoSerie[];
  elegido: string | null;     // el ciclo que se está viendo, o null en el histórico
  forma?: 'barras' | 'linea';
}) {
  const t = TONOS[tono];
  const animado = useContador(valor ?? 0);
  return (
    <div className={`bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-0.5 ${t.hover}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-400 font-medium">{titulo}</h3>
        <div className={`p-2 rounded-lg ${t.icono}`}><Icono size={20} /></div>
      </div>
      <p className="text-3xl font-bold">{valor === null ? formato(null) : formato(animado)}</p>
      <p className={`text-sm mt-2 ${t.nota}`}>{nota}</p>
      {serie && serie.length > 1 && <MiniSerie serie={serie} elegido={elegido} forma={forma} trazo={t.trazo} />}
    </div>
  );
}
