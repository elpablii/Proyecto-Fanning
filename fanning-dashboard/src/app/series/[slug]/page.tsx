import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SeriesClient from '@/components/SeriesClient';
import { getColores, getRealezaDeTitulo, getTitulo, getTitulosPorTipo } from '@/lib/data';
import type { SerieExtra } from '@/types/media';

// Solo existen las páginas de las series del manifest; cualquier otra URL da 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getTitulosPorTipo('series').map(slug => ({ slug }));
}

// El nombre del título en la pestaña del navegador.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const datos = getTitulo(decodeURIComponent(slug), 'series');
  return { title: datos ? `${datos.movieData.title} - Proyecto Fanning` : 'Proyecto Fanning' };
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const datos = getTitulo(decodeURIComponent(slug), 'series');
  if (!datos) notFound();
  // Los episodios van sin su vocabulario: la página lo pide aparte al estudiar (ver vocabulario/route.ts).
  let extraData: SerieExtra | null = null;
  if (datos.extraData) {
    const { episodes, ...resto } = datos.extraData;
    extraData = {
      ...resto,
      episodes: episodes?.map(ep => ({
        code: ep.code, name: ep.name, level: ep.level, englishAnalysis: ep.englishAnalysis,
        count: ep.count, dialogues: ep.dialogues, duration: ep.duration, durationEstimated: ep.durationEstimated,
        palabras: ep.vocabulary.length,
      })),
    };
  }
  return <SeriesClient movieData={datos.movieData} extraData={extraData} realeza={getRealezaDeTitulo(datos.movieData)}
    color={getColores()[datos.movieData.title] ?? null} />;
}
