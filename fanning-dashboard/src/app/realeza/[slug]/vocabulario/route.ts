import { getArtista, getRealeza, getVocabularioArtista } from '@/lib/data';
import { slugArtista } from '@/lib/realeza';

// Todo el vocabulario de un artista, como un JSON aparte que se genera en el build.
// La página no lo trae (puede pesar mucho): lo pide recién al tocar "Estudiar".
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return getRealeza().map(a => ({ slug: slugArtista(a.nombre) }));
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artista = getArtista(slug);
  if (!artista) return new Response(null, { status: 404 });
  return Response.json(getVocabularioArtista(artista.nombre));
}
