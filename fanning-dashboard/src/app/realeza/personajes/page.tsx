import PersonajesClient, { type CartaPersonaje } from '@/components/realeza/PersonajesClient';
import { getPersonajes, getRealeza, getTandasPorTitulo, getTodos } from '@/lib/data';
import { ordenGrupo } from '@/lib/realeza';

export const metadata = {
  title: 'Galería de Personajes - Proyecto Fanning',
  description: 'A quién interpreta cada reina y cada rey de la Realeza en los títulos del Proyecto Fanning, como cartas coleccionables.',
};

export default function PersonajesPage() {
  const todos = new Map(getTodos().map(m => [m.title, m]));
  const tandas = getTandasPorTitulo();
  const personajes = getPersonajes();

  // Una carta por personaje: si interpreta al mismo en varios títulos (Harley Quinn, Bella Swan),
  // es una sola carta con todos. Las apariciones como sí mismo van juntas en otra.
  const cartas: CartaPersonaje[] = [];
  const realeza = getRealeza().sort((a, b) => ordenGrupo(a) - ordenGrupo(b));
  for (const a of realeza) {
    const porNombre = new Map<string, CartaPersonaje>();
    for (const p of personajes[a.nombre] ?? []) {
      const m = todos.get(p.titulo);
      if (!m) continue;
      const tipo = m.type ?? 'movie';
      const enTandas = tandas.get(`${tipo}:${m.title}`);
      const titulo = { title: m.title, type: tipo, posterUrl: m.posterUrl ?? null, fecha: enTandas?.fecha ?? null, tanda: enTandas?.numeros[0] ?? null };
      for (const nombre of p.personajes.length ? p.personajes : [null]) {
        const clave = nombre?.toLowerCase() ?? '';
        const carta = porNombre.get(clave) ?? {
          artista: { nombre: a.nombre, foto: a.foto, tipo: a.tipo, rango: a.rango },
          personaje: nombre, voz: false, titulos: [],
        };
        carta.voz ||= p.papel === 'voz';
        if (!carta.titulos.some(t => t.title === titulo.title)) carta.titulos.push(titulo);
        porNombre.set(clave, carta);
      }
    }
    for (const carta of porNombre.values()) {
      // En el orden en que entró al proyecto; lo que aún no tiene tanda va al final.
      carta.titulos.sort((x, y) => (x.fecha ?? '9999').localeCompare(y.fecha ?? '9999') || x.title.localeCompare(y.title));
      cartas.push(carta);
    }
  }

  return <PersonajesClient cartas={cartas} />;
}
