import { notFound } from 'next/navigation';
import CasaFanningClient, { type Hermana, type ProximoJuntas } from '@/components/realeza/CasaFanningClient';
import { getArtista, getProximamente, getTandasPorTitulo, getTodos } from '@/lib/data';
import { estadisticas, slugArtista } from '@/lib/realeza';

export const metadata = {
  title: 'La Casa Fanning - Proyecto Fanning',
  description: 'Dakota y Elle Fanning, las hermanas que le dan su nombre al proyecto: sus títulos entrelazados en el tiempo, cara a cara.',
};

const HERMANAS = ['Dakota Fanning', 'Elle Fanning'] as const;

export default function CasaFanningPage() {
  const todos = getTodos();
  const tandas = getTandasPorTitulo();
  const proximamente = getProximamente();

  const hermanas = HERMANAS.map(nombre => getArtista(slugArtista(nombre)));
  if (hermanas.some(h => !h)) notFound();

  const datos: Hermana[] = hermanas.map(a => {
    const stats = estadisticas(a!.nombre, todos);
    // En el orden en que entró al proyecto (lo que aún no tiene tanda va al final), como en su página.
    const titulos = stats.titulos
      .map(t => {
        const enTandas = tandas.get(`${t.type ?? 'movie'}:${t.title}`);
        return { ...t, tandas: enTandas?.numeros ?? [], fecha: enTandas?.fecha ?? null, anio: enTandas?.anio ?? null };
      })
      .sort((x, y) => (x.fecha ?? '9999').localeCompare(y.fecha ?? '9999') || x.title.localeCompare(y.title));
    return { artista: a!, stats: { ...stats, titulos }, proximos: proximamente[a!.nombre]?.length ?? 0 };
  });

  // Lo que viene con las dos: el mismo título (y temporada) en la planificación de ambas.
  const clave = (p: { titulo: string; temporada: number | null }) => `${p.titulo.toLowerCase()}|${p.temporada ?? ''}`;
  const deElle = new Set((proximamente[HERMANAS[1]] ?? []).map(clave));
  const juntas: ProximoJuntas[] = (proximamente[HERMANAS[0]] ?? []).filter(p => deElle.has(clave(p)));

  // Títulos que ya están en el proyecto con las dos.
  const yaJuntas = todos.filter(m => HERMANAS.every(h => m.realeza?.[h])).map(({ title, type, posterUrl }) => ({ title, type, posterUrl }));

  return <CasaFanningClient hermanas={[datos[0], datos[1]]} juntas={juntas} yaJuntas={yaJuntas} hoy={new Date().toLocaleDateString('sv')} />;
}
