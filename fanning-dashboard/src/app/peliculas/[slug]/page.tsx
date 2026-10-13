import fs from 'fs';
import path from 'path';
import PeliculaClient from '@/components/PeliculaClient';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const manifestPath = path.join(process.cwd(), 'public', 'data', 'manifest.json');
  if (!fs.existsSync(manifestPath)) return [];
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const allMovies = manifest.all?.movieList || [];
  return allMovies
    .filter((m: any) => m.type === 'movie')
    .map((m: any) => ({
      slug: m.title,
    }));
}

export default async function PeliculaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedTitle = decodeURIComponent(slug);
  
  let movieData = null;
  let extraData = null;
  const manifestPath = path.join(process.cwd(), 'public', 'data', 'manifest.json');

  try {
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const allMovies = manifest.all.movieList;
      movieData = allMovies.find((m: any) => m.title === decodedTitle) || null;
    }

    const extraPath = path.join(process.cwd(), 'public', 'data', 'pelis', `${decodedTitle}.json`);
    if (fs.existsSync(extraPath)) {
      extraData = JSON.parse(fs.readFileSync(extraPath, 'utf8'));
    }
  } catch (error) {
    console.error("Error loading server data for slug:", decodedTitle, error);
  }

  if (!movieData) {
    notFound();
  }

  return <PeliculaClient slug={slug} initialMovieData={movieData} initialExtraData={extraData} />;
}
