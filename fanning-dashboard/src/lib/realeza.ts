// La Realeza del proyecto (ver Reglas 5, 7 y 8). La lista está en contenido/realeza.json;
// `python fanning.py realeza` le pone la foto y el nacimiento desde TMDB y marca en cada
// ficha qué artistas aparecen. Los rangos superiores van aparte: una persona está en un solo grupo.
import { comprension } from '@/lib/stats';
import type { MovieStats } from '@/types/manifest';

export interface Artista {
  nombre: string;
  tipo: 'reina' | 'rey';
  rango?: 'supremo' | 'platonico';
  tmdb?: number;
  foto?: string;
  nacimiento?: string;        // "1952-06-07"
  fallecimiento?: string;
  cita?: CitaArtista;
}

// Una línea de diálogo del artista, elegida a mano y verificada contra los subtítulos
// (python fanning.py citas, que anota el episodio y el segundo).
export interface CitaArtista {
  texto: string;
  titulo: string;             // título de la ficha
  personaje: string;
  episodio?: string;          // series: "S01E01"
  segundo?: number;           // desde el comienzo del título o del episodio
}

// Cómo participa en un título (lo trae `python fanning.py realeza` de TMDB, o se pone a mano).
export type Papel = 'actua' | 'voz' | 'aparece' | 'musica' | 'produce' | 'escribe' | 'dirige' | 'equipo';

export const PAPELES: Record<Papel, string> = {
  actua: 'Actúa', voz: 'Pone la voz', aparece: 'Aparece', musica: 'Su música', produce: 'Produce',
  escribe: 'Escribe', dirige: 'Dirige', equipo: 'En el equipo',
};

export type IdGrupo = 'supremos' | 'platonicos' | 'reinas' | 'reyes';

export interface GrupoRealeza {
  id: IdGrupo;
  nombre: string;
  descripcion: string;
  miembros: Artista[];
}

const GRUPOS: Omit<GrupoRealeza, 'miembros'>[] = [
  { id: 'supremos', nombre: 'Reyes Supremos', descripcion: 'El rango más alto entre los reyes.' },
  { id: 'platonicos', nombre: 'Amores Platónicos', descripcion: 'El rango más alto entre las reinas.' },
  { id: 'reinas', nombre: 'Reinas', descripcion: '' },
  { id: 'reyes', nombre: 'Reyes', descripcion: '' },
];

export function grupoDe(a: Artista): IdGrupo {
  if (a.rango === 'supremo') return 'supremos';
  if (a.rango === 'platonico') return 'platonicos';
  return a.tipo === 'reina' ? 'reinas' : 'reyes';
}

export function agrupar<T extends Artista>(artistas: T[]): (Omit<GrupoRealeza, 'miembros'> & { miembros: T[] })[] {
  return GRUPOS.map(g => ({ ...g, miembros: artistas.filter(a => grupoDe(a) === g.id) }));
}

// Ancla de cada artista en /realeza: "Anya Taylor-Joy" -> "anya-taylor-joy".
export function slugArtista(nombre: string): string {
  return nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ---------- Estadísticas de cada artista ----------
// Salen de los mismos títulos que cuenta el inicio (getTodos()), sin recalcular nada.

export type TituloArtista = Pick<MovieStats, 'title' | 'type' | 'posterUrl' | 'count' | 'dialogues' | 'duration' | 'level'> & {
  papeles: Papel[];
};

export interface EstadisticasArtista {
  titulos: TituloArtista[];
  palabras: number;
  lineas: number;
  minutos: number;
  comprension: number | null;
  nivel: string | null;       // promedio de los niveles MCER, pesado por las líneas de diálogo
}

const NIVELES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// "B1-B2" o "B2/C1" cuentan como el punto medio entre los dos.
function valorNivel(nivel: string | undefined): number | null {
  const partes = (nivel ?? '').split(/[-/]/).map(n => NIVELES.indexOf(n.trim().toUpperCase())).filter(i => i >= 0);
  return partes.length ? partes.reduce((s, i) => s + i, 0) / partes.length : null;
}

export function estadisticas(nombre: string, todos: MovieStats[]): EstadisticasArtista {
  const titulos = todos
    .filter(m => m.realeza?.[nombre])
    .map(({ title, type, posterUrl, count, dialogues, duration, level, realeza }) =>
      ({ title, type, posterUrl, count, dialogues, duration, level, papeles: realeza![nombre] }));
  const palabras = titulos.reduce((s, t) => s + t.count, 0);
  const lineas = titulos.reduce((s, t) => s + (t.dialogues ?? 0), 0);
  let peso = 0, suma = 0;
  for (const t of titulos) {
    const v = valorNivel(t.level);
    if (v === null) continue;
    const p = t.dialogues || 1;
    peso += p;
    suma += v * p;
  }
  return {
    titulos,
    palabras,
    lineas,
    minutos: titulos.reduce((s, t) => s + (t.duration ?? 0), 0),
    comprension: comprension(lineas, palabras),
    nivel: peso ? NIVELES[Math.round(suma / peso)] : null,
  };
}

export function hrefTitulo(t: Pick<MovieStats, 'title' | 'type'>): string {
  return `/${t.type === 'series' ? 'series' : 'peliculas'}/${encodeURIComponent(t.title)}`;
}

// ---------- Página de cada artista (/realeza/margot-robbie) ----------

export const NOMBRE_RANGO: Record<IdGrupo, string> = {
  supremos: 'Rey Supremo', platonicos: 'Amor Platónico', reinas: 'Reina', reyes: 'Rey',
};

// Un miembro de la Realeza tal como aparece en la ficha de un título.
export type ArtistaEnTitulo = Pick<Artista, 'nombre' | 'foto' | 'tipo' | 'rango'> & { papeles: Papel[] };

export function hrefArtista(nombre: string): string {
  return `/realeza/${slugArtista(nombre)}`;
}

// Orden de la Realeza en un título: primero los rangos superiores, como en el Salón del Trono.
export function ordenGrupo(a: Artista): number {
  return GRUPOS.findIndex(g => g.id === grupoDe(a));
}

// Con quién comparte títulos: los demás miembros que aparecen en alguno de los suyos.
export interface Conexion {
  nombre: string;
  titulos: string[];
}

export function conexiones(nombre: string, todos: MovieStats[]): Conexion[] {
  const comun = new Map<string, string[]>();
  for (const m of todos) {
    if (!m.realeza?.[nombre]) continue;
    for (const otro of Object.keys(m.realeza)) {
      if (otro !== nombre) comun.set(otro, [...(comun.get(otro) ?? []), m.title]);
    }
  }
  return [...comun.entries()]
    .map(([n, titulos]) => ({ nombre: n, titulos }))
    .sort((a, b) => b.titulos.length - a.titulos.length || a.nombre.localeCompare(b.nombre));
}

// ---------- Reina o Rey del día ----------
// Si alguien de la Realeza está de cumpleaños, es su día. Si no, se turnan quienes tienen
// títulos en el proyecto: cada día avanza un paso fijo, así pasan todos antes de repetir.

export function cumpleHoy(a: Artista, hoy: string): boolean {
  return !!a.nacimiento && !a.fallecimiento && a.nacimiento.slice(5) === hoy.slice(5);
}

function mcd(a: number, b: number): number {
  return b ? mcd(b, a % b) : a;
}

export function delDia<T extends Artista>(artistas: T[], hoy: string, conTitulos: (a: T) => boolean): T | null {
  const [a, m, d] = hoy.split('-').map(Number);
  const dia = Math.floor(Date.UTC(a, m - 1, d) / 86_400_000);
  const cumpleaneros = artistas.filter(x => cumpleHoy(x, hoy));
  const turno = cumpleaneros.length ? cumpleaneros : artistas.filter(conTitulos);
  if (!turno.length) return null;
  // Un paso que no divida al total, para que el turno no se salte a nadie.
  const paso = [7, 11, 13, 17, 19, 23].find(p => mcd(p, turno.length) === 1) ?? 1;
  return turno[(dia * paso) % turno.length];
}
