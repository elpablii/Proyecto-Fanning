"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Flag, Sparkles } from 'lucide-react';
import { miles, porcentaje } from '@/lib/formato';
import { comprension } from '@/lib/stats';

// Lo mínimo de cada tanda que necesita la portada (sale de timeline.json, con las partes
// de una tanda ya juntas).
export interface TandaResumen {
  numero: number;
  title: string;
  date: string;
  anio: string;
  palabras: number;
  lineas: number;
  ingles: { vista: number; repaso: number; revision: number };  // minutos
  titulos: string[];
}

const PARTES_INGLES = [
  { clave: 'vista', nombre: 'Primera vista', color: 'bg-purple-400' },
  { clave: 'repaso', nombre: 'Repaso diario del vocabulario', color: 'bg-pink-400' },
  { clave: 'revision', nombre: 'Segunda vista', color: 'bg-sky-400' },
] as const;

// Tendencia: comprensión de las últimas VENTANA tandas juntas (misma fórmula que el resto
// de la página, sumando líneas y palabras), para que una tanda corta no mueva la curva.
const VENTANA = 5;
const HITOS = [10000, 20000, 30000];

function comprensionDe(tandas: TandaResumen[]): number | null {
  return comprension(tandas.reduce((s, t) => s + t.lineas, 0), tandas.reduce((s, t) => s + t.palabras, 0));
}

interface Punto {
  n: number;           // número de la tanda
  title: string;
  date: string;
  anio: string;
  titulos: string[];
  palabras: number;
  comprension: number | null;
  tendencia: number | null;
}

function Detalle({ p }: { p: Punto }) {
  return (
    <div className="bg-gray-950/95 border border-gray-700 rounded-xl p-3 shadow-xl text-sm">
      <p className="font-semibold text-white">{p.title}</p>
      <p className="text-xs text-gray-500 mb-2">{p.date}</p>
      <p className="text-gray-300">Comprensión: <span className="font-semibold text-white">{porcentaje(p.comprension)}</span></p>
      <p className="text-gray-300">Tendencia: <span className="font-semibold text-white">{porcentaje(p.tendencia)}</span></p>
      <p className="text-gray-400">{miles(p.palabras)} palabras</p>
      <p className="text-xs text-gray-500 mt-2 line-clamp-3">{p.titulos.join(' · ')}</p>
    </div>
  );
}

// Marcas "redondas" de un eje (pasos de 1, 2 o 5 por potencia de 10), enteras.
function marcas(desde: number, hasta: number, cuantas: number): number[] {
  const crudo = Math.max(1, (hasta - desde) / cuantas);
  const base = 10 ** Math.floor(Math.log10(crudo));
  const paso = [1, 2, 5, 10].map(f => f * base).find(p => p >= crudo) ?? crudo;
  const lista: number[] = [];
  for (let v = Math.ceil(desde / paso) * paso; v <= hasta; v += paso) lista.push(v);
  return lista;
}

const ALTO = 288;  // h-72
const MARGEN = { arriba: 8, derecha: 8, abajo: 24, izquierda: 40 };

// Gráfico de puntos (cada tanda) + línea de tendencia, dibujado a mano en SVG: antes era
// Recharts, que sumaba unos 107 KB comprimidos de JavaScript solo para este gráfico.
function Grafico({ puntos, piso, techo, rango }: { puntos: Punto[]; piso: number; techo: number; rango: Punto[] | null }) {
  const caja = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(640);  // hasta medir la caja, el SVG se escala solo (viewBox)
  const [activo, setActivo] = useState<Punto | null>(null);

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const observador = new ResizeObserver(([e]) => setAncho(Math.max(200, e.contentRect.width)));
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  const n0 = puntos[0].n;
  const n1 = puntos.at(-1)!.n;
  const x = (n: number) => MARGEN.izquierda + (n1 === n0 ? 0.5 : (n - n0) / (n1 - n0)) * (ancho - MARGEN.izquierda - MARGEN.derecha);
  const y = (v: number) => MARGEN.arriba + (1 - (v - piso) / (techo - piso || 1)) * (ALTO - MARGEN.arriba - MARGEN.abajo);

  // La tendencia se corta donde falta el dato, en vez de unir los extremos.
  const tendencia = puntos.reduce((d, p, i) => {
    if (p.tendencia === null) return d;
    const previo = i > 0 && puntos[i - 1].tendencia !== null;
    return `${d}${previo ? 'L' : 'M'}${x(p.n).toFixed(1)},${y(p.tendencia).toFixed(1)}`;
  }, '');

  // El cursor (o el dedo) elige la tanda más cercana en el eje horizontal. En pantallas táctiles
  // el detalle queda abierto al levantar el dedo (ahí el puntero "sale" apenas termina el toque).
  const alMover = (e: React.PointerEvent<SVGSVGElement>) => {
    const limites = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - limites.left) * (ancho / limites.width);
    setActivo(puntos.reduce((a, p) => (Math.abs(x(p.n) - px) < Math.abs(x(a.n) - px) ? p : a)));
  };

  const xActivo = activo ? x(activo.n) : 0;
  // El recuadro va al lado del punto, del lado con más espacio, sin salirse del gráfico.
  const anchoDetalle = Math.min(256, ancho);
  const izquierdaDetalle = Math.max(0, Math.min(ancho - anchoDetalle,
    xActivo > ancho / 2 ? xActivo - 12 - anchoDetalle : xActivo + 12));
  return (
    <div ref={caja} className="relative h-full w-full">
      <svg viewBox={`0 0 ${ancho} ${ALTO}`} className="w-full h-full touch-pan-y" onPointerMove={alMover} onPointerDown={alMover}
        onPointerLeave={e => e.pointerType === 'mouse' && setActivo(null)}>
        {marcas(piso, techo, 5).map(v => (
          <g key={v}>
            <line x1={MARGEN.izquierda} x2={ancho - MARGEN.derecha} y1={y(v)} y2={y(v)} stroke="#1F2937" />
            <text x={MARGEN.izquierda - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize={12} fill="#6B7280">{v}%</text>
          </g>
        ))}
        {marcas(n0, n1, Math.max(2, Math.floor(ancho / 80))).map(n => (
          <text key={n} x={x(n)} y={ALTO - 6} textAnchor="middle" fontSize={12} fill="#6B7280">{n}°</text>
        ))}
        {rango && rango.length > 0 && (
          <rect x={x(rango[0].n)} y={MARGEN.arriba} width={Math.max(1, x(rango.at(-1)!.n) - x(rango[0].n))}
            height={ALTO - MARGEN.arriba - MARGEN.abajo} fill="#A855F7" fillOpacity={0.08} stroke="#A855F7" strokeOpacity={0.25} />
        )}
        {activo && <line x1={xActivo} x2={xActivo} y1={MARGEN.arriba} y2={ALTO - MARGEN.abajo} stroke="#4B5563" />}
        {puntos.map(p => p.comprension !== null && (
          <circle key={p.n} cx={x(p.n)} cy={y(p.comprension)} r={3} fill="#6B7280" stroke="#111827" strokeWidth={1} />
        ))}
        <path d={tendencia} fill="none" stroke="#C084FC" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {activo?.comprension != null && (
          <circle cx={xActivo} cy={y(activo.comprension)} r={5} fill="#E5E7EB" stroke="#111827" strokeWidth={2} />
        )}
      </svg>
      {activo && (
        <div className="absolute top-2 pointer-events-none z-10"
          style={{ left: `${(izquierdaDetalle / ancho) * 100}%`, width: anchoDetalle }}>
          <Detalle p={activo} />
        </div>
      )}
    </div>
  );
}

function Tarjeta({ icono: Icono, titulo, children }: { icono: typeof Clock; titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 space-y-1">
      <p className="text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
        <Icono size={14} className="text-purple-400" /> {titulo}
      </p>
      {children}
    </div>
  );
}

export default function EvolucionComprension({ tandas, anio }: { tandas: TandaResumen[]; anio: string }) {
  const puntos = useMemo<Punto[]>(() => tandas.map((t, i) => ({
    n: t.numero,
    title: t.title,
    date: t.date,
    anio: t.anio,
    titulos: t.titulos,
    palabras: t.palabras,
    comprension: comprensionDe([t]),
    tendencia: comprensionDe(tandas.slice(Math.max(0, i - VENTANA + 1), i + 1)),
  })), [tandas]);

  // Hitos de palabras acumuladas: en qué tanda se cruzó cada uno (siempre sobre el histórico).
  const hitos = useMemo(() => {
    let acumulado = 0;
    const cruces: { meta: number; tanda: TandaResumen }[] = [];
    for (const t of tandas) {
      acumulado += t.palabras;
      for (const meta of HITOS) {
        if (acumulado >= meta && !cruces.some(c => c.meta === meta)) cruces.push({ meta, tanda: t });
      }
    }
    return cruces;
  }, [tandas]);

  const delPeriodo = anio === 'all' ? tandas : tandas.filter(t => t.anio === anio);
  const ventana = Math.min(VENTANA, Math.floor(delPeriodo.length / 2));
  const inicio = ventana ? comprensionDe(delPeriodo.slice(0, ventana)) : null;
  const fin = ventana ? comprensionDe(delPeriodo.slice(-ventana)) : null;
  const ingles = {
    vista: delPeriodo.reduce((s, t) => s + t.ingles.vista, 0),
    repaso: delPeriodo.reduce((s, t) => s + t.ingles.repaso, 0),
    revision: delPeriodo.reduce((s, t) => s + t.ingles.revision, 0),
  };
  const minutos = ingles.vista + ingles.repaso + ingles.revision;
  const mejor = delPeriodo.reduce<TandaResumen | null>((a, t) => (!a || (comprensionDe([t]) ?? 0) > (comprensionDe([a]) ?? 0) ? t : a), null);

  const valores = puntos.map(p => p.comprension).filter((v): v is number => v !== null);
  const piso = valores.length ? Math.floor(Math.min(...valores) - 1) : 0;
  const techo = valores.length ? Math.min(100, Math.ceil(Math.max(...valores) + 1)) : 100;
  const rango = anio === 'all' ? null : puntos.filter(p => p.anio === anio);

  if (!puntos.length) return null;

  return (
    <div className="space-y-6">
      {/* Titular */}
      {inicio !== null && fin !== null && (
        <div>
          <p className="text-sm text-gray-400">
            Comprensión de tus primeras {ventana} tandas {anio === 'all' ? '' : `de ${anio} `}frente a las últimas {ventana}
          </p>
          <p className="text-3xl sm:text-4xl font-bold text-white mt-1 flex flex-wrap items-baseline gap-x-3">
            <span className="text-gray-400">{porcentaje(inicio, 1)}</span>
            <span className="text-gray-600 text-2xl">→</span>
            <span>{porcentaje(fin, 1)}</span>
            <span className={`text-base font-semibold ${fin >= inicio ? 'text-emerald-400' : 'text-orange-400'}`}>
              {fin >= inicio ? '+' : '−'}{porcentaje(Math.abs(Math.round(fin * 10) - Math.round(inicio * 10)) / 10, 1).replace('%', '')} puntos
            </span>
          </p>
        </div>
      )}

      {/* Comprensión por tanda */}
      <div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-400 mb-2">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-500" /> Cada tanda</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 rounded bg-purple-400" /> Tendencia (últimas {VENTANA} tandas)</span>
          {rango && <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-purple-500/15 border border-purple-500/30" /> Ciclo {anio}</span>}
        </div>
        <div className="h-72 w-full" role="img" aria-label="Comprensión por tanda y su tendencia">
          <Grafico puntos={puntos} piso={piso} techo={techo} rango={rango} />
        </div>
        <p className="text-xs text-gray-500 mt-1">Eje horizontal: número de tanda. Pasa el cursor (o toca) sobre el gráfico para ver cada tanda.</p>
      </div>

      {/* Datos que dan escala */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Tarjeta icono={Clock} titulo={`Horas en inglés${anio === 'all' ? '' : ` (${anio})`}`}>
          <p className="text-2xl font-bold text-white">{miles(Math.round(minutos / 60))} h</p>
          <p className="text-xs text-gray-500">≈ {miles(Math.round(minutos / 60 / 24))} días seguidos</p>
          {minutos > 0 && (
            <div className="pt-2 space-y-1.5">
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                {PARTES_INGLES.map(p => (
                  <div key={p.clave} className={p.color} style={{ width: `${(ingles[p.clave] / minutos) * 100}%` }} />
                ))}
              </div>
              <ul className="text-xs space-y-0.5">
                {PARTES_INGLES.map(p => (
                  <li key={p.clave} className="flex items-center gap-1.5 text-gray-400">
                    <span className={`w-2 h-2 rounded-full ${p.color}`} />
                    {p.nombre}
                    <span className="ml-auto text-gray-200">{miles(Math.round(ingles[p.clave] / 60))} h</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Tarjeta>
        <Tarjeta icono={Sparkles} titulo={`Mejor tanda${anio === 'all' ? '' : ` (${anio})`}`}>
          {mejor && (
            <>
              <p className="text-2xl font-bold text-white">{porcentaje(comprensionDe([mejor]))}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{mejor.title} · {mejor.titulos.join(', ')}</p>
            </>
          )}
        </Tarjeta>
        <Tarjeta icono={Flag} titulo="Hitos de palabras">
          <ul className="space-y-1">
            {hitos.map(h => (
              <li key={h.meta} className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-semibold text-white">{miles(h.meta)}</span>
                <span className="text-xs text-gray-500 text-right">{h.tanda.title} · {h.tanda.date.split(', ').at(-1)}</span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      </div>
    </div>
  );
}
