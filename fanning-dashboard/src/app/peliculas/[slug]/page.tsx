import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PeliculaClient from '@/components/PeliculaClient';
import { getTitulo, getTitulosPorTipo } from '@/lib/data';

// Solo existen las páginas de las películas del manifest; cualquier otra URL da 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getTitulosPorTipo('movie').map(slug => ({ slug }));
}

// El nombre del título en la pestaña del navegador.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const datos = getTitulo(decodeURIComponent(slug), 'movie');
  return { title: datos ? `${datos.movieData.title} - Proyecto Fanning` : 'Proyecto Fanning' };
}

export default async function PeliculaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const datos = getTitulo(decodeURIComponent(slug), 'movie');
  if (!datos) notFound();
  return <PeliculaClient movieData={datos.movieData} extraData={datos.extraData} />;
}
