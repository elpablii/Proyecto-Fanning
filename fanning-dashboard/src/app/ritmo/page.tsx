import RitmoClient, { type CicloRitmo, type EpisodioRapido, type TituloRitmo } from '@/components/ritmo/RitmoClient';
import { getManifest, getTandasPorTitulo, getTitulo, getTodos } from '@/lib/data';
import type { ManifestYear } from '@/types/manifest';

export const metadata = {
  title: 'El Ritmo del Inglés - Proyecto Fanning',
  description: 'A qué velocidad se habla en cada película y serie del Proyecto Fanning: los diálogos más rápidos, los más pausados y si hablar rápido hace más difícil el inglés.',
};

export default function RitmoPage() {
  const tandas = getTandasPorTitulo();
  const titulos: TituloRitmo[] = [];
  // ppm y duración de cada episodio, para el episodio más rápido y el ritmo de cada ciclo.
  const episodios = new Map<string, { ppm: number | null; minutos: number | null; name: string }>();
  let rapido: EpisodioRapido | null = null;

  for (const m of getTodos()) {
    const tipo = m.type ?? 'movie';
    const extra = getTitulo(m.title, tipo)?.extraData;
    const detalle = extra?.levelDetail;
    for (const e of extra?.episodes ?? []) {
      const ppm = e.levelDetail?.dialogos?.ppm ?? null;
      episodios.set(`${m.title}|${e.code}`, { ppm, minutos: e.duration ?? null, name: e.name });
      if (ppm !== null && (!rapido || ppm > rapido.ppm)) rapido = { serie: m.title, code: e.code, name: e.name, ppm };
    }
    const ppm = detalle?.dialogos?.ppm;
    if (ppm == null) continue;
    titulos.push({
      title: m.title, type: tipo, poster: m.posterUrl ?? null, ppm,
      puntaje: detalle?.puntaje ?? null, level: m.level ?? null,
      minutos: m.duration ?? null, lineas: m.dialogues ?? 0,
      anio: tandas.get(`${tipo}:${m.title}`)?.anio ?? m.years?.[0] ?? null,
    });
  }

  // Ritmo de cada ciclo: lo que entró ese año (en las series, solo sus episodios de ese año),
  // promediado por minutos, para que una película larga pese más que un corto.
  const manifest = getManifest() ?? {};
  const porTitulo = new Map(titulos.map(t => [`${t.type}:${t.title}`, t]));
  const ciclos: CicloRitmo[] = [];
  for (const [anio, datos] of Object.entries(manifest)) {
    if (!/^\d{4}$/.test(anio) || !datos || Array.isArray(datos)) continue;
    let peso = 0, suma = 0;
    for (const m of (datos as ManifestYear).movieList) {
      const partes = m.type === 'series'
        ? m.episodes.map(e => episodios.get(`${m.title}|${e.code}`)).filter(e => e !== undefined)
        : [{ ppm: porTitulo.get(`movie:${m.title}`)?.ppm ?? null, minutos: m.duration ?? null }];
      for (const p of partes) {
        if (p.ppm === null || !p.minutos) continue;
        peso += p.minutos;
        suma += p.ppm * p.minutos;
      }
    }
    if (peso) ciclos.push({ anio, ppm: suma / peso, titulos: (datos as ManifestYear).uniqueMovies });
  }
  ciclos.sort((a, b) => a.anio.localeCompare(b.anio));

  return <RitmoClient titulos={titulos} ciclos={ciclos} episodioRapido={rapido} />;
}
