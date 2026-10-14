"use client";

import { useState } from 'react';
import { porcentaje } from '@/lib/formato';

// Regla del Redondeo Estratégico: desde 99,445% se registra 100%.
const UMBRAL_REDONDEO = 99.445;

// Prueba de la fórmula de comprensión con números propios. Parte con los de la 1° Tanda.
export default function CalculadoraComprension({ lineasIniciales, palabrasIniciales }: { lineasIniciales: number; palabrasIniciales: number }) {
  const [lineas, setLineas] = useState(String(lineasIniciales));
  const [palabras, setPalabras] = useState(String(palabrasIniciales));

  const l = Number(lineas);
  const p = Number(palabras);
  const valido = Number.isFinite(l) && Number.isFinite(p) && l > 0 && p >= 0 && p <= l;
  const exacto = valido ? ((l - p) / l) * 100 : null;
  const redondea = exacto !== null && exacto >= UMBRAL_REDONDEO && exacto < 100;

  const campo = 'w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500/60';

  return (
    <div className="bg-black/40 border border-emerald-500/20 rounded-2xl p-5 space-y-4">
      <p className="text-sm font-semibold text-emerald-300">Pruébalo</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-gray-400 space-y-1">
          <span>Líneas totales</span>
          <input type="number" min={1} inputMode="numeric" value={lineas} onChange={e => setLineas(e.target.value)} className={campo} />
        </label>
        <label className="text-xs text-gray-400 space-y-1">
          <span>Palabras y frases no entendidas</span>
          <input type="number" min={0} inputMode="numeric" value={palabras} onChange={e => setPalabras(e.target.value)} className={campo} />
        </label>
      </div>
      {exacto === null ? (
        <p className="text-sm text-orange-300">Las líneas deben ser más que cero y no menos que las palabras.</p>
      ) : (
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-500">Comprensión</p>
            <p className="text-3xl font-bold text-emerald-300">{porcentaje(redondea ? 100 : exacto)}</p>
          </div>
          {redondea && (
            <p className="text-xs text-amber-300 pb-1">
              El valor exacto es {porcentaje(exacto, 3)}: por el Redondeo Estratégico se registra 100%.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
