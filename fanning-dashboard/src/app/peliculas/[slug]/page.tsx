import { notFound } from 'next/navigation';
import PeliculaClient from '@/components/PeliculaClient';
import { getTitulo, getTitulosPorTipo } from '@/lib/data';

// Solo existen las páginas de las películas del manifest; cualquier otra URL da 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getTitulosPorTipo('movie').map(slug => ({ slug }));
}

export default async function PeliculaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const datos = getTitulo(decodeURIComponent(slug), 'movie');
  if (!datos) notFound();
  return <PeliculaClient movieData={datos.movieData} extraData={datos.extraData} />;
}
