import { getDiccionario } from '@/lib/data';

// Las ~28.000 palabras del Diccionario Fanning como un JSON aparte que se genera en el build.
// La página no las trae (pesan casi 2 MB): las pide recién al abrirse.
export const dynamic = 'force-static';

export function GET() {
  const { tandas, palabras } = getDiccionario();
  return Response.json({ tandas, palabras });
}
