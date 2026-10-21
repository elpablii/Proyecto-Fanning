// Etiquetas del Diccionario Fanning: la nota entre paréntesis de cada entrada ("Rely (verbo)"),
// ordenada en claves fijas por scripts/metricas/etiquetas.py. Aquí están sus nombres y definiciones,
// que usan el filtro del diccionario, la página de cada palabra y el glosario de la Constitución.
// Si se agrega una clave allá, se agrega aquí.

export type GrupoEtiqueta = 'gramatica' | 'traduccion' | 'registro' | 'idioma';

export const GRUPOS_ETIQUETA: Record<GrupoEtiqueta, string> = {
  gramatica: 'Qué es',
  traduccion: 'Cómo se traduce',
  registro: 'Registro',
  idioma: 'Variante e idioma',
};

export interface Etiqueta {
  nombre: string;
  grupo: GrupoEtiqueta;
  definicion: string;
}

export const ETIQUETAS: Record<string, Etiqueta> = {
  'verbo': { nombre: 'Verbo', grupo: 'gramatica', definicion: 'Una acción. Se anota para distinguirla de la misma palabra con otro uso ("play": jugar / obra).' },
  'verbo-frasal': { nombre: 'Verbo frasal', grupo: 'gramatica', definicion: 'Phrasal verb: un verbo con una partícula (up, down, out…) que juntos significan otra cosa, como "wind up".' },
  'sustantivo': { nombre: 'Sustantivo', grupo: 'gramatica', definicion: 'Una persona, cosa, lugar o idea.' },
  'adjetivo': { nombre: 'Adjetivo', grupo: 'gramatica', definicion: 'Describe a un sustantivo (también sus formas comparativa y superlativa).' },
  'adverbio': { nombre: 'Adverbio', grupo: 'gramatica', definicion: 'Dice cómo, cuándo o dónde pasa algo.' },
  'interjeccion': { nombre: 'Interjección', grupo: 'gramatica', definicion: 'Una exclamación que se dice sola.' },
  'preposicion': { nombre: 'Preposición', grupo: 'gramatica', definicion: 'Une palabras e indica relación (lugar, tiempo, causa…).' },
  'pregunta': { nombre: 'Pregunta', grupo: 'gramatica', definicion: 'La entrada es una pregunta completa.' },
  'expresion': { nombre: 'Expresión', grupo: 'gramatica', definicion: 'Una expresión hecha, un modismo o un refrán, que se usa tal cual.' },
  'acotacion': { nombre: 'Acotación', grupo: 'gramatica', definicion: 'Palabras o frases que indican acciones o cosas que no son diálogos, como [blows raspberry].' },
  'sigla': { nombre: 'Sigla', grupo: 'gramatica', definicion: 'Una abreviatura hecha con iniciales, como ER o FBI.' },
  'frase-no-literal': { nombre: 'Frase no literal', grupo: 'traduccion', definicion: 'Más del 50 % de la frase se traduce de forma no literal.' },
  'parcialmente-no-literal': { nombre: 'Parcialmente no literal', grupo: 'traduccion', definicion: 'Menos del 50 % es no literal; el resto se traduce de forma literal.' },
  'no-literal': { nombre: 'No literal', grupo: 'traduccion', definicion: 'Frases cortas que se traducen de forma no literal.' },
  'literal': { nombre: 'Literal', grupo: 'traduccion', definicion: 'Se aclara que se traduce palabra por palabra.' },
  'traduccion-aproximada': { nombre: 'Traducción aproximada', grupo: 'traduccion', definicion: 'Su traducción no es muy precisa y puede tener distintas interpretaciones.' },
  'informal': { nombre: 'Informal', grupo: 'registro', definicion: 'Coloquial o jerga: se dice entre conocidos, no en un contexto formal.' },
  'despectivo': { nombre: 'Despectivo', grupo: 'registro', definicion: 'Ofensivo o con intención de menospreciar.' },
  'ingles-antiguo': { nombre: 'Inglés antiguo', grupo: 'idioma', definicion: 'Inglés arcaico o de época, como "thou" o "be-eth".' },
  'ingles-britanico': { nombre: 'Inglés británico', grupo: 'idioma', definicion: 'Una palabra o un uso propio del Reino Unido.' },
};

// Otros idiomas: "idioma-frances", "idioma-aleman"... (la clave dice cuál).
const IDIOMAS: Record<string, string> = {
  frances: 'Francés', aleman: 'Alemán', latin: 'Latín', italiano: 'Italiano', espanol: 'Español', japones: 'Japonés',
  ruso: 'Ruso', chino: 'Chino', portugues: 'Portugués', hebreo: 'Hebreo', yiddish: 'Ídish', griego: 'Griego',
  coreano: 'Coreano', arabe: 'Árabe', hawaiano: 'Hawaiano',
};

export const OTRO_IDIOMA: Etiqueta = {
  nombre: 'Otro idioma', grupo: 'idioma', definicion: 'La entrada no está en inglés: francés, alemán, latín…',
};

export function etiqueta(clave: string): Etiqueta {
  if (clave.startsWith('idioma-')) {
    return { ...OTRO_IDIOMA, nombre: IDIOMAS[clave.slice(7)] ?? clave.slice(7) };
  }
  return ETIQUETAS[clave] ?? { nombre: clave, grupo: 'gramatica', definicion: '' };
}

// El filtro "idioma" junta todos los idiomas que no son inglés.
export function tieneEtiqueta(etiquetas: string[] | null | undefined, filtro: string): boolean {
  if (!etiquetas) return false;
  return filtro === 'idioma' ? etiquetas.some(e => e.startsWith('idioma-')) : etiquetas.includes(filtro);
}

// Colores de cada grupo, para las etiquetas de las tarjetas.
export const COLOR_GRUPO: Record<GrupoEtiqueta, string> = {
  gramatica: 'bg-sky-500/10 border-sky-400/30 text-sky-200',
  traduccion: 'bg-amber-500/10 border-amber-400/30 text-amber-200',
  registro: 'bg-rose-500/10 border-rose-400/30 text-rose-200',
  idioma: 'bg-teal-500/10 border-teal-400/30 text-teal-200',
};
