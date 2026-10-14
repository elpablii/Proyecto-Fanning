import React from 'react';
import { GraduationCap } from 'lucide-react';
import { miles } from '@/lib/formato';
import { NivelDetalle } from '@/types/media';

const NIVELES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const COLORES: Record<string, string> = {
  A1: 'bg-emerald-400', A2: 'bg-emerald-600', B1: 'bg-yellow-400', B2: 'bg-orange-500', C1: 'bg-red-500', C2: 'bg-fuchsia-600',
};

// 4.37 -> "4,4"
const decimal = (n: number) => n.toFixed(1).replace('.', ',');

function Senal({ nombre, peso, valor }: { nombre: string; peso: string; valor: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{nombre} <span className="text-gray-500">({peso})</span></span>
        <span className="text-gray-400">{decimal(valor)} / 6</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-linear-to-r from-cyan-500 to-purple-500" style={{ width: `${(Math.min(Math.max(valor, 0), 6) / 6) * 100}%` }} />
      </div>
    </div>
  );
}

// Nivel de inglés (Marco Común Europeo) calculado a partir del vocabulario, los diálogos y los temas.
export default function NivelMcer({ detalle, tipo }: { detalle: NivelDetalle; tipo: 'película' | 'serie' }) {
  const { vocabulario, dialogos, senales } = detalle;
  return (
    <section className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl backdrop-blur-xl mb-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <GraduationCap className="text-cyan-400" /> Nivel de inglés (MCER)
      </h2>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-col items-center justify-center md:w-48 shrink-0">
          <span className="text-5xl font-black text-white">{detalle.nivel}</span>
          <span className="text-sm text-gray-400 mt-2">puntaje {decimal(detalle.puntaje)} de 6</span>
          {detalle.rango && (
            <span className="text-xs text-gray-400 mt-2 text-center">
              episodios entre {detalle.rango[0]} y {detalle.rango[1]}
            </span>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <Senal nombre="Vocabulario" peso="60 %" valor={senales.vocabulario} />
          <Senal nombre="Diálogos" peso="25 %" valor={senales.dialogos} />
          <Senal nombre="Temas" peso="15 %" valor={senales.temas} />
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm text-gray-300 mb-2">Nivel de las palabras y frases no entendidas</p>
        <div className="flex h-4 rounded-full overflow-hidden bg-white/10">
          {NIVELES.map(n => (vocabulario.distribucion[n] ?? 0) > 0 && (
            <div key={n} className={COLORES[n]} style={{ width: `${vocabulario.distribucion[n]}%` }} title={`${n}: ${vocabulario.distribucion[n]}%`} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
          {NIVELES.map(n => (
            <span key={n} className="flex items-center gap-1">
              <span className={`w-2.5 h-2.5 rounded-full ${COLORES[n]}`} />
              {n} {decimal(vocabulario.distribucion[n] ?? 0)}%
            </span>
          ))}
        </div>
      </div>

      <ul className="mt-6 space-y-1 text-sm text-gray-400">
        {dialogos && (
          <li>Para conocer el 95 % de las palabras de los diálogos hace falta un nivel {decimal(dialogos.cobertura95)} de 6.</li>
        )}
        {dialogos?.ppm && <li>Se habla a {miles(dialogos.ppm)} palabras por minuto.</li>}
        {vocabulario.densidad !== null && <li>Hay {decimal(vocabulario.densidad)} palabras o frases no entendidas por cada 100 líneas.</li>}
        {detalle.temas.length > 0 && <li>Vocabulario especializado: {detalle.temas.join(' y ')}.</li>}
      </ul>
      <p className="mt-4 text-xs text-gray-500">
        Calculado para esta {tipo} con listas de vocabulario por nivel (CEFR-J y Octanove) y la frecuencia de cada palabra.
      </p>
    </section>
  );
}
