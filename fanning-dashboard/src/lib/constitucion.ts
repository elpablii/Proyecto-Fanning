// Datos reales que ilustran cada regla en /reglas. Se calculan en el build a partir de
// timeline.json y manifest.json, con el mismo universo que el inicio: las cifras oficiales
// son las de la página, así que aquí no se filtra nada que el inicio sí cuente. Las partes de
// una tanda (14a°, 14b°) cuentan como una sola tanda.
import { agruparTandas, getLineaDeTiempo, getManifest, getTodos, type Ciclo, type MinutosIngles, type Tanda, type TandaCompleta } from '@/lib/data';
import { comprension } from '@/lib/stats';

export interface Aparicion {
  texto: string;
  titulo: string;
  tipo: 'movie' | 'series';
  tanda: string;              // "14° Tanda"
}

export interface TandaCuota {
  title: string;
  palabras: number;
  cuota: number;
}

// Una tanda completa, lista para mostrar.
export interface TandaVista {
  title: string;
  date: string;
  palabras: number;
  lineas: number;
  comprension: number | null;
  duracion: number;
  textos: string[];           // lo que se vio, en todas sus partes
}

export interface DatosConstitucion {
  resumen: { tandas: number; titulos: number; palabras: number; lineas: number; comprension: number | null; ingles: MinutosIngles };
  ciclos: Ciclo[];
  sagas: { nombre: string; entregas: Aparicion[] }[];
  indultos: Aparicion[];
  cuotas: { ciclo: string; tandas: TandaCuota[] };
  festivas: Tanda[];
  dosSesiones: { cantidad: number; total: number; masLarga: TandaVista | null };
  largas: { cantidad: number; masLarga: { title: string; duracion: number } | null };
  primeraTanda: TandaVista | null;
  mejorTanda: TandaVista | null;
  niveles: { nivel: string; cantidad: number }[];
}

// Cuota de palabras de una tanda regular (Regla 9): desde el ciclo 2027, máximo de 450 todo el año;
// hasta 2026, según el mes de su primera parte.
export function cuotaDe(fecha: string, ciclo: string): number {
  if (Number(ciclo) >= 2027) return 450;
  const mes = Number(fecha.slice(5, 7));
  return mes >= 7 && mes <= 9 ? 500 : 400;
}

function vista(t: TandaCompleta): TandaVista {
  return {
    title: t.title, date: t.date, palabras: t.palabras, lineas: t.lineas,
    comprension: comprension(t.lineas, t.palabras), duracion: t.duracion,
    textos: t.partes.flatMap(p => p.items.map(i => i.texto)),
  };
}

// Primera aparición de cada título que cumple `filtro`, en orden de tandas.
function apariciones(tandas: TandaCompleta[], filtro: (titulo: string) => boolean): Aparicion[] {
  const vistos = new Set<string>();
  const lista: Aparicion[] = [];
  for (const t of tandas) {
    for (const i of t.partes.flatMap(p => p.items)) {
      if (!filtro(i.titulo) || vistos.has(i.titulo)) continue;
      vistos.add(i.titulo);
      lista.push({ texto: i.texto, titulo: i.titulo, tipo: i.tipo, tanda: t.title });
    }
  }
  return lista;
}

const festiva = (t: TandaCompleta) => t.partes.some(p => p.etiqueta !== null);
const mayor = <T,>(lista: T[], valor: (x: T) => number): T | null =>
  lista.reduce<T | null>((a, x) => (!a || valor(x) > valor(a) ? x : a), null);

const ORDEN_NIVELES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function getDatosConstitucion(): DatosConstitucion {
  const { ciclos, tandas: partes } = getLineaDeTiempo();
  const tandas = agruparTandas(partes);
  const titulos = getTodos();
  const total = getManifest()?.all;

  const cicloActual = tandas.at(-1)?.anio ?? '';
  const largos = titulos.filter(m => (m.type ?? 'movie') === 'movie' && (m.duration ?? 0) > 120);
  const masLargo = largos.reduce<(typeof largos)[number] | null>((a, m) => (!a || (m.duration ?? 0) > (a.duration ?? 0) ? m : a), null);

  // Niveles MCER de los títulos: los intermedios ("B1-B2") se cuentan en el nivel de abajo.
  const porNivel = new Map<string, number>();
  for (const m of titulos) {
    const base = m.level?.slice(0, 2);
    if (base && ORDEN_NIVELES.includes(base)) porNivel.set(base, (porNivel.get(base) ?? 0) + 1);
  }

  const dobles = tandas.filter(t => t.partes.some(p => p.dosSesiones));
  const suma = (f: (t: TandaCompleta) => number) => tandas.reduce((s, t) => s + f(t), 0);

  return {
    resumen: {
      tandas: tandas.length,
      titulos: total?.uniqueMovies ?? titulos.length,
      palabras: total?.totalWords ?? 0,
      lineas: total?.totalDialogues ?? 0,
      comprension: comprension(total?.totalDialogues, total?.totalWords),
      ingles: {
        vista: suma(t => t.ingles.vista),
        repaso: suma(t => t.ingles.repaso),
        revision: suma(t => t.ingles.revision),
        diasRepaso: suma(t => t.ingles.diasRepaso),
      },
    },
    ciclos,
    sagas: [
      { nombre: 'Rambo', entregas: apariciones(tandas, t => t.startsWith('Rambo')) },
      { nombre: 'Star Wars', entregas: apariciones(tandas, t => t.startsWith('Star Wars')) },
      { nombre: 'Rocky', entregas: apariciones(tandas, t => t.startsWith('Rocky')) },
    ].filter(s => s.entregas.length > 1),
    indultos: apariciones(tandas, t => t === 'Once Upon a Time in Hollywood' || t === 'Euphoria'),
    cuotas: {
      ciclo: cicloActual,
      tandas: tandas
        .filter(t => t.anio === cicloActual && !festiva(t))
        .map(t => ({ title: t.title, palabras: t.palabras, cuota: cuotaDe(t.fecha, t.anio) })),
    },
    festivas: partes.filter(t => t.etiqueta !== null),
    dosSesiones: {
      cantidad: dobles.length,
      total: tandas.length,
      masLarga: (m => m && vista(m))(mayor(dobles, t => t.duracion)),
    },
    largas: {
      cantidad: largos.length,
      masLarga: masLargo ? { title: masLargo.title, duracion: masLargo.duration ?? 0 } : null,
    },
    primeraTanda: tandas[0] ? vista(tandas[0]) : null,
    mejorTanda: mayor(tandas.map(vista), t => t.comprension ?? 0),
    niveles: ORDEN_NIVELES.map(nivel => ({ nivel, cantidad: porNivel.get(nivel) ?? 0 })),
  };
}
