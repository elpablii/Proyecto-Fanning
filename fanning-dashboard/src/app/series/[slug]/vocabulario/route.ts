import { getTitulo, getTitulosPorTipo } from '@/lib/data';
import type { VocabularioSerie } from '@/types/media';

// El vocabulario de cada serie, por episodio, como un JSON aparte que se genera en el build.
// La página de la serie no lo trae (pesa cientos de KB): lo pide recién al tocar "Estudiar".
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return getTitulosPorTipo('series').map(slug => ({ slug }));
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const datos = getTitulo(decodeURIComponent(slug), 'series');
  if (!datos) return new Response(null, { status: 404 });
  const vocabulario: VocabularioSerie = Object.fromEntries(
    (datos.extraData?.episodes ?? []).map(e => [e.code, e.vocabulary]),
  );
  return Response.json(vocabulario);
}
