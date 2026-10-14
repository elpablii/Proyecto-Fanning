import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SeriesClient from '@/components/SeriesClient';
import { getTitulo, getTitulosPorTipo } from '@/lib/data';

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
  return <SeriesClient movieData={datos.movieData} extraData={datos.extraData} />;
}
