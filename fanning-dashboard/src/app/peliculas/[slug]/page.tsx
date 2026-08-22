import fs from 'fs';
import path from 'path';
import PeliculaClient from '@/components/PeliculaClient';
import { notFound } from 'next/navigation';
import { englishAnalysisOverrides } from '@/lib/englishAnalysisOverrides';
import { vocabularyOverrides } from '@/lib/vocabularyOverrides';

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
      
      // Override con las descripciones manuales si existen
      if (extraData && englishAnalysisOverrides[decodedTitle]) {
        extraData.englishAnalysis = englishAnalysisOverrides[decodedTitle];
      }

      // Override de vocabulario manual si existe
      if (extraData && extraData.vocabulary && Array.isArray(extraData.vocabulary) && vocabularyOverrides[decodedTitle]) {
        const overrides = vocabularyOverrides[decodedTitle];
        extraData.vocabulary = extraData.vocabulary
          .map((item: any) => {
            const override = overrides[item.word];
            if (override) {
              if (override.remove) return null; // Eliminar
              return {
                word: override.word !== undefined ? override.word : item.word,
                translation: override.translation !== undefined ? override.translation : item.translation
              };
            }
            return item;
          })
          .filter(Boolean); // Remover los nulos
      }
    }
  } catch (error) {
    console.error("Error loading server data for slug:", decodedTitle, error);
  }

  if (!movieData) {
    console.log("NOT FOUND. slug:", slug, "decoded:", decodedTitle);
    console.log("Manifest size:", manifestPath, "Exists?", fs.existsSync(manifestPath!));
    notFound();
  }

  return <PeliculaClient slug={slug} initialMovieData={movieData} initialExtraData={extraData} />;
}
