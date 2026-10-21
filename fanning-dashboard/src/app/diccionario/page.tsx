import DiccionarioClient, { type TituloDiccionario } from '@/components/diccionario/DiccionarioClient';
import { getDiccionario, getManifest, getRealeza, getTodos } from '@/lib/data';
import { ordenGrupo } from '@/lib/realeza';

export const metadata = {
  title: 'Diccionario Fanning - Proyecto Fanning',
  description: 'Todas las palabras y frases aprendidas en el Proyecto Fanning, con su traducción, dónde aparecieron y en qué tanda se aprendieron.',
};

export default function DiccionarioPage() {
  const { titulos, palabras } = getDiccionario();
  const porTitulo = new Map(getTodos().map(m => [`${m.type ?? 'movie'}:${m.title}`, m]));
  // Los títulos en el mismo orden que los índices del diccionario, con lo poco que muestra cada palabra.
  const lista: TituloDiccionario[] = titulos.map(t => {
    const m = porTitulo.get(`${t.type}:${t.title}`);
    return { title: t.title, type: t.type, poster: m?.posterUrl ?? null, realeza: Object.keys(m?.realeza ?? {}) };
  });
  const enUso = new Set(lista.flatMap(t => t.realeza));
  const artistas = getRealeza()
    .filter(a => enUso.has(a.nombre))
    .sort((a, b) => ordenGrupo(a) - ordenGrupo(b) || a.nombre.localeCompare(b.nombre))
    .map(({ nombre, foto, tipo, rango }) => ({ nombre, foto, tipo, rango }));
  return (
    <DiccionarioClient
      titulos={lista}
      artistas={artistas}
      distintas={palabras.length}
      // La cifra oficial del inicio; el diccionario suma lo mismo (ver scripts/metricas/diccionario.py).
      anotaciones={getManifest()?.all?.totalWords ?? palabras.reduce((s, p) => s + p[2], 0)}
      repetidas={palabras.filter(p => p[2] > 1).length}
    />
  );
}
