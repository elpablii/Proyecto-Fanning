"use client";

import { useMemo } from 'react';
import {
  CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
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

function Detalle({ active, payload }: { active?: boolean; payload?: { payload: Punto }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-gray-950/95 border border-gray-700 rounded-xl p-3 shadow-xl max-w-64 text-sm">
      <p className="font-semibold text-white">{p.title}</p>
      <p className="text-xs text-gray-500 mb-2">{p.date}</p>
      <p className="text-gray-300">Comprensión: <span className="font-semibold text-white">{porcentaje(p.comprension)}</span></p>
      <p className="text-gray-300">Tendencia: <span className="font-semibold text-white">{porcentaje(p.tendencia)}</span></p>
      <p className="text-gray-400">{miles(p.palabras)} palabras</p>
      <p className="text-xs text-gray-500 mt-2 line-clamp-3">{p.titulos.join(' · ')}</p>
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
  const piso = Math.floor(Math.min(...valores) - 1);
  const techo = Math.min(100, Math.ceil(Math.max(...valores) + 1));
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
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={puntos} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="#1F2937" vertical={false} />
              {rango && rango.length > 0 && (
                <ReferenceArea x1={rango[0].n} x2={rango.at(-1)!.n} fill="#A855F7" fillOpacity={0.08} stroke="#A855F7" strokeOpacity={0.25} />
              )}
              <XAxis dataKey="n" type="number" domain={[puntos[0].n, puntos.at(-1)!.n]} stroke="#6B7280" axisLine={false} tickLine={false}
                tick={{ fontSize: 12 }} allowDecimals={false} tickFormatter={(n: number) => `${n}°`} />
              <YAxis domain={[piso, techo]} stroke="#6B7280" axisLine={false} tickLine={false} tick={{ fontSize: 12 }}
                tickFormatter={(v: number) => `${v}%`} allowDecimals={false} />
              <Tooltip content={<Detalle />} cursor={{ stroke: '#4B5563', strokeWidth: 1 }} />
              <Line dataKey="comprension" stroke="transparent" isAnimationActive={false}
                dot={{ r: 3, fill: '#6B7280', stroke: '#111827', strokeWidth: 1 }}
                activeDot={{ r: 5, fill: '#E5E7EB', stroke: '#111827', strokeWidth: 2 }} />
              <Line dataKey="tendencia" stroke="#C084FC" strokeWidth={2.5} dot={false} activeDot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-1">Eje horizontal: número de tanda. Pasa el cursor sobre un punto para ver la tanda.</p>
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
