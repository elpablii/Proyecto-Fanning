import TimelineClient from '@/components/TimelineClient';
import { getTandas, getTodos } from '@/lib/data';

export const metadata = {
  title: 'Línea de Tiempo - Proyecto Fanning',
  description: 'Historial de tandas de vocabulario procesadas en el proyecto.',
};

// Póster de cada ítem de las tandas. Las tandas guardan los títulos como texto libre
// ("Star Wars VI: Return of the Jedi"), por eso se emparejan por coincidencia de texto.
// Pendiente (informe, punto 11): guardar en contenido/tandas.json el título exacto de la ficha.
function postersDeTandas(): Record<string, string> {
  const titulos = [...getTodos()].sort((a, b) => b.title.length - a.title.length);
  const mapa: Record<string, string> = {};
  for (const tanda of getTandas()) {
    for (const item of tanda.items) {
      const texto = item.toLowerCase();
      const encontrado = titulos.find(m => {
        const t = m.title.toLowerCase();
        return texto.includes(t)
          || (t.includes('inside out') && texto.includes('inside out'))
          || (t.includes('star wars') && texto.includes('star wars'))
          || (t.includes('taylor swift') && (texto.includes('ts:') || texto.includes('taylor swift')));
      });
      if (encontrado?.posterUrl) mapa[item] = encontrado.posterUrl;
    }
  }
  return mapa;
}

export default function TimelinePage() {
  return <TimelineClient tandas={getTandas()} posters={postersDeTandas()} />;
}
