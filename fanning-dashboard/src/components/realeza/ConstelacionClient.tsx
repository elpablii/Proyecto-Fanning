"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Crown, Heart, Sparkles } from 'lucide-react';
import { miles } from '@/lib/formato';
import { tmdb } from '@/lib/tmdb';
import { ALTO, ANCHO, type Estrella, type Hilo } from '@/lib/constelacion';
import { grupoDe, hrefArtista, NOMBRE_RANGO } from '@/lib/realeza';
import FondoAnimado from '@/components/ui/FondoAnimado';

// Dos colores nada más (validados para daltonismo sobre el fondo oscuro): oro para los reyes y
// rosa para las reinas. El rango superior va aparte, con un anillo doble y su ícono.
const ORO = '#c27d0c';
const ROSA = '#db4c91';
const colorDe = (e: Pick<Estrella, 'tipo'>) => (e.tipo === 'rey' ? ORO : ROSA);

// Cielo de fondo: puntos fijos (no al azar, para que el build y el navegador coincidan).
const CIELO = Array.from({ length: 140 }, (_, i) => ({
  x: (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * ANCHO,
  y: (Math.sin(i * 78.233) * 12543.123 % 1 + 1) % 1 * ALTO,
  r: 0.4 + (i % 5) * 0.25,
  retraso: (i % 9) * 0.45,
}));

export default function ConstelacionClient({ estrellas, hilos }: { estrellas: Estrella[]; hilos: Hilo[] }) {
  const [elegida, setElegida] = useState<string | null>(null);
  const [encima, setEncima] = useState<string | null>(null);
  const activa = encima ?? elegida;

  const porNombre = useMemo(() => new Map(estrellas.map(e => [e.nombre, e])), [estrellas]);
  const vecinos = useMemo(() => {
    const v = new Map<string, Hilo[]>();
    for (const h of hilos) {
      v.set(h.a, [...(v.get(h.a) ?? []), h]);
      v.set(h.b, [...(v.get(h.b) ?? []), h]);
    }
    return v;
  }, [hilos]);
  const cerca = useMemo(() => {
    if (!activa) return null;
    return new Set([activa, ...(vecinos.get(activa) ?? []).map(h => (h.a === activa ? h.b : h.a))]);
  }, [activa, vecinos]);

  const detalle = activa ? porNombre.get(activa) : null;
  const lazos = activa
    ? (vecinos.get(activa) ?? []).map(h => ({ otro: h.a === activa ? h.b : h.a, titulos: h.titulos }))
      .sort((a, b) => b.titulos.length - a.titulos.length || a.otro.localeCompare(b.otro))
    : [];
  const fuertes = [...hilos].sort((a, b) => b.titulos.length - a.titulos.length || a.a.localeCompare(b.a)).slice(0, 12);
  const solitarias = estrellas.filter(e => !vecinos.has(e.nombre));

  return (
    <div className="min-h-screen text-gray-100 font-sans">
      <FondoAnimado paleta="constelacion" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <Link href="/realeza" className="inline-flex items-center text-gray-400 hover:text-white transition mb-6 text-sm font-medium">
          <ArrowLeft size={16} className="mr-2" /> Volver al Salón del Trono
        </Link>

        <header className="text-center mb-8">
          <Sparkles size={34} className="mx-auto text-indigo-300 mb-2" aria-hidden />
          <h1 className="font-real text-4xl md:text-5xl font-bold bg-linear-to-r from-indigo-200 via-pink-300 to-amber-200 bg-clip-text text-transparent brillo-titulo">
            La Constelación Real
          </h1>
          <p className="text-gray-400 mt-3 max-w-2xl mx-auto">
            Cada estrella es alguien de la Realeza y cada hilo, un título que comparten. Mientras más grande la estrella,
            más títulos tiene en el proyecto; mientras más grueso el hilo, más títulos en común.
          </p>
          <p className="text-sm text-gray-500 mt-2">{miles(estrellas.length)} estrellas · {miles(hilos.length)} hilos</p>
        </header>

        {/* Leyenda */}
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-300 mb-4" aria-label="Leyenda">
          <li className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full border-[3px]" style={{ borderColor: ORO }} /> Rey</li>
          <li className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full border-[3px]" style={{ borderColor: ROSA }} /> Reina</li>
          <li className="flex items-center gap-2"><Crown size={14} className="text-gray-300" /> Rey Supremo</li>
          <li className="flex items-center gap-2"><Heart size={14} className="text-gray-300" /> Amor Platónico</li>
          <li className="flex items-center gap-2"><span className="w-6 h-0.5 bg-gray-400 rounded" /> Títulos en común</li>
        </ul>

        <div className="grid lg:grid-cols-[1fr_20rem] gap-6 items-start">
          {/* El mapa */}
          <div className="rounded-3xl border border-white/10 bg-[#050816] overflow-hidden">
            <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="w-full h-auto block select-none" role="img"
              aria-label="Mapa de las conexiones entre los miembros de la Realeza; el detalle está en la lista de abajo"
              onClick={() => setElegida(null)}>
              <defs>
                {estrellas.map((e, i) => (
                  <clipPath key={e.nombre} id={`foto-${i}`}><circle cx={e.x} cy={e.y} r={e.r} /></clipPath>
                ))}
                <filter id="brillo" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" />
                </filter>
              </defs>

              {CIELO.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#e5e7eb" className="titilar" style={{ animationDelay: `${p.retraso}s` }} />
              ))}

              {/* Hilos */}
              {hilos.map(h => {
                const p = porNombre.get(h.a)!, q = porNombre.get(h.b)!;
                const resaltado = activa && (h.a === activa || h.b === activa);
                return (
                  <line key={`${h.a}|${h.b}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y}
                    stroke="#e5e7eb" strokeLinecap="round"
                    strokeOpacity={activa ? (resaltado ? 0.85 : 0.04) : 0.3}
                    strokeWidth={1 + (h.titulos.length - 1) * 1.5}
                    className="transition-[stroke-opacity] duration-300">
                    <title>{`${h.a} y ${h.b}: ${h.titulos.join(', ')}`}</title>
                  </line>
                );
              })}

              {/* Estrellas */}
              {estrellas.map((e, i) => {
                const superior = !!e.rango;
                const apagada = cerca && !cerca.has(e.nombre);
                const color = colorDe(e);
                const Icono = e.rango === 'platonico' ? Heart : Crown;
                return (
                  <g key={e.nombre} role="button" tabIndex={0}
                    aria-label={`${e.nombre}, ${NOMBRE_RANGO[grupoDe(e)]}, ${e.titulos} títulos, ${(vecinos.get(e.nombre) ?? []).length} conexiones`}
                    aria-pressed={elegida === e.nombre}
                    onClick={ev => { ev.stopPropagation(); setElegida(n => (n === e.nombre ? null : e.nombre)); }}
                    onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setElegida(e.nombre); } }}
                    onPointerEnter={ev => { if (ev.pointerType === 'mouse') setEncima(e.nombre); }}
                    onPointerLeave={() => setEncima(null)}
                    onFocus={() => setEncima(e.nombre)} onBlur={() => setEncima(null)}
                    className="cursor-pointer outline-none transition-opacity duration-300 [&:focus-visible>circle.anillo]:stroke-white"
                    style={{ opacity: apagada ? 0.2 : 1 }}>
                    {superior && <circle cx={e.x} cy={e.y} r={e.r + 6} fill={color} opacity={0.35} filter="url(#brillo)" />}
                    {/* Zona de toque más grande que la estrella */}
                    <circle cx={e.x} cy={e.y} r={e.r + 10} fill="transparent" />
                    <circle cx={e.x} cy={e.y} r={e.r} fill="#111827" />
                    {e.foto && (
                      <image href={tmdb(e.foto, 'w185')} x={e.x - e.r} y={e.y - e.r} width={e.r * 2} height={e.r * 2}
                        preserveAspectRatio="xMidYMin slice" clipPath={`url(#foto-${i})`} />
                    )}
                    <circle className="anillo" cx={e.x} cy={e.y} r={e.r} fill="none" stroke={color} strokeWidth={activa === e.nombre ? 4 : 3} />
                    {superior && <circle cx={e.x} cy={e.y} r={e.r + 5} fill="none" stroke={color} strokeWidth={1.5} />}
                    {superior && (
                      <g transform={`translate(${e.x + e.r * 0.62},${e.y - e.r * 0.62})`}>
                        <circle r={9} fill="#030712" stroke={color} strokeWidth={1.5} />
                        <Icono x={-6} y={-6} width={12} height={12} color="#f3f4f6" fill={e.rango === 'platonico' ? '#f3f4f6' : 'none'} strokeWidth={2.5} />
                      </g>
                    )}
                    <text x={e.x} y={e.y + e.r + 15} textAnchor="middle" fontSize={12} fontWeight={600}
                      fill="#e5e7eb" stroke="#050816" strokeWidth={3} paintOrder="stroke">{e.nombre}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Detalle de la estrella activa */}
          <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 lg:sticky lg:top-6 min-h-48" aria-live="polite">
            {detalle ? (
              <>
                <div className="flex items-center gap-3">
                  {detalle.foto && <img src={tmdb(detalle.foto, 'w185')} alt="" className="w-14 h-14 rounded-full object-cover object-top border-[3px]" style={{ borderColor: colorDe(detalle) }} />}
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-400">{NOMBRE_RANGO[grupoDe(detalle)]}</p>
                    <p className="text-lg font-bold text-white leading-tight">{detalle.nombre}</p>
                    <p className="text-xs text-gray-400">{miles(detalle.titulos)} {detalle.titulos === 1 ? 'título' : 'títulos'} · {miles(detalle.palabras)} palabras</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mt-4 mb-2">
                  {lazos.length ? `Comparte títulos con ${lazos.length} ${lazos.length === 1 ? 'miembro' : 'miembros'} de la Realeza:` : 'Una estrella solitaria: aún no comparte títulos con nadie de la Realeza.'}
                </p>
                <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {lazos.map(l => (
                    <li key={l.otro} className="text-sm">
                      <button onClick={() => setElegida(l.otro)} className="font-semibold text-gray-100 hover:text-white hover:underline">{l.otro}</button>
                      <span className="block text-xs text-gray-400">{l.titulos.join(', ')}</span>
                    </li>
                  ))}
                </ul>
                <Link href={hrefArtista(detalle.nombre)} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-300 hover:gap-2 transition-all">
                  Ver su página <ArrowRight size={14} />
                </Link>
              </>
            ) : (
              <div className="text-sm text-gray-400 space-y-2">
                <p className="text-gray-200 font-semibold">Toca una estrella</p>
                <p>Se iluminan sus hilos y aquí aparece con quién comparte títulos.</p>
                {solitarias.length > 0 && (
                  <p>Estrellas solitarias por ahora: {solitarias.map(s => s.nombre).join(' y ')}.</p>
                )}
              </div>
            )}
          </aside>
        </div>

        {/* La misma información como lista (también para lectores de pantalla) */}
        <section aria-labelledby="lazos" className="mt-12 max-w-3xl mx-auto">
          <h2 id="lazos" className="text-xl font-bold mb-4">Los lazos más fuertes</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="py-2 font-medium">Entre</th>
                <th className="py-2 font-medium text-right">Títulos</th>
                <th className="py-2 font-medium pl-4 hidden sm:table-cell">Cuáles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {fuertes.map(h => (
                <tr key={`${h.a}|${h.b}`}>
                  <td className="py-2 text-gray-100">
                    <Link href={hrefArtista(h.a)} className="hover:underline">{h.a}</Link>
                    <span className="text-gray-500"> y </span>
                    <Link href={hrefArtista(h.b)} className="hover:underline">{h.b}</Link>
                  </td>
                  <td className="py-2 text-right tabular-nums text-gray-200">{h.titulos.length}</td>
                  <td className="py-2 pl-4 text-gray-400 hidden sm:table-cell">{h.titulos.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
