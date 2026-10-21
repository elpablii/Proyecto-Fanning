import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getDiccionario } from '@/lib/data';
import { hrefPalabra, slugsDiccionario } from '@/lib/diccionario';
import { COLOR_GRUPO, ETIQUETAS, GRUPOS_ETIQUETA, OTRO_IDIOMA, tieneEtiqueta, type Etiqueta, type GrupoEtiqueta } from '@/lib/etiquetas';
import { miles } from '@/lib/formato';

// Glosario de las etiquetas del Diccionario Fanning (ver src/lib/etiquetas.ts), con cuántas palabras
// tiene cada una y un ejemplo real: la palabra con esa etiqueta que se anotó más veces. En las etiquetas
// de frases el ejemplo es una frase: "Whose" lleva "Pregunta" porque una vez se anotó así, pero no la explica.
const DE_FRASES = new Set(['pregunta', 'expresion', 'acotacion', 'frase-no-literal', 'parcialmente-no-literal', 'no-literal']);
export default function GlosarioEtiquetas() {
  const { palabras } = getDiccionario();
  const slugs = slugsDiccionario(palabras);
  const filas: [string, Etiqueta][] = [...Object.entries(ETIQUETAS), ['idioma', OTRO_IDIOMA]];

  const datos = new Map(filas.map(([clave]) => {
    let cantidad = 0;
    let ejemplo = -1;
    const puntaje = (i: number) => (DE_FRASES.has(clave) && palabras[i][0].includes(' ') ? 1e6 : 0) + palabras[i][2];
    palabras.forEach((p, i) => {
      if (!tieneEtiqueta(p[6], clave)) return;
      cantidad++;
      if (ejemplo < 0 || puntaje(i) > puntaje(ejemplo)) ejemplo = i;
    });
    return [clave, { cantidad, ejemplo }];
  }));

  return (
    <div className="space-y-6">
      {(Object.keys(GRUPOS_ETIQUETA) as GrupoEtiqueta[]).map(g => (
        <div key={g} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-400">{GRUPOS_ETIQUETA[g]}</h3>
          <dl className="grid sm:grid-cols-2 gap-3">
            {filas.filter(([, e]) => e.grupo === g).map(([clave, e]) => {
              const { cantidad, ejemplo } = datos.get(clave)!;
              const p = ejemplo >= 0 ? palabras[ejemplo] : null;
              return (
                <div key={clave} className="bg-white/3 border border-white/10 rounded-xl px-4 py-3 space-y-1.5">
                  <dt className="flex items-center justify-between gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${COLOR_GRUPO[e.grupo]}`}>{e.nombre}</span>
                    {cantidad > 0 && (
                      <Link href={`/diccionario?etiqueta=${clave}`} className="inline-flex items-center gap-1 text-xs text-emerald-300 hover:underline">
                        {miles(cantidad)} {cantidad === 1 ? 'palabra' : 'palabras'} <ArrowRight size={12} aria-hidden />
                      </Link>
                    )}
                  </dt>
                  <dd className="text-sm text-gray-400 leading-relaxed">{e.definicion}</dd>
                  {p && (
                    <dd className="text-sm text-gray-500">
                      Ej.: <Link href={hrefPalabra(slugs[ejemplo])} className="text-gray-200 hover:underline">{p[0]}</Link>: {p[1]}
                    </dd>
                  )}
                </div>
              );
            })}
          </dl>
        </div>
      ))}
      <p className="text-sm text-gray-400 leading-relaxed bg-white/3 border border-white/10 rounded-xl px-4 py-3">
        <span className="font-semibold text-white">Contexto.</span> Lo que la nota dice y no es una etiqueta («en música», «en algunos
        contextos», «alusivo a una persona») queda en cursiva junto a la palabra: es el ámbito donde vale esa traducción.
      </p>
    </div>
  );
}
