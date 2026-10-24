import AlbumClient, { type Lamina, type PaginaAlbum } from '@/components/album/AlbumClient';
import { getLineaDeTiempo, getRealezaDeTitulo, getTandasFuturas, getTodos } from '@/lib/data';
import { hrefTitulo } from '@/lib/realeza';
import type { MovieStats } from '@/types/manifest';

export const metadata = {
  title: 'Álbum Fanning - Proyecto Fanning',
  description: 'El Proyecto Fanning como un álbum de láminas: cada tanda es una página y cada título, una lámina pegada.',
};

const plano = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// Brillo de la lámina: rosa con un Amor Platónico, oro con un Rey Supremo, plateada con el resto de la Realeza.
function rareza(m: MovieStats | undefined): Lamina['rareza'] {
  const realeza = m ? getRealezaDeTitulo(m) : [];
  if (realeza.some(a => a.rango === 'platonico')) return 'rosa';
  if (realeza.some(a => a.rango === 'supremo')) return 'oro';
  return realeza.length ? 'plata' : 'comun';
}

export default function AlbumPage() {
  const todos = getTodos();
  const porTitulo = new Map<string, MovieStats>();
  for (const m of todos) for (const t of [m.title, ...(m.aliases ?? [])]) porTitulo.set(plano(t), m);

  let numero = 0;
  const vecesVisto = new Map<string, number>();
  const paginas: PaginaAlbum[] = getLineaDeTiempo().tandas.map(t => ({
    id: `${t.numero}${t.parte ?? ''}`, numero: t.numero, fecha: t.fecha, anio: t.anio,
    etiqueta: t.etiqueta, planificada: false, porConfirmar: false,
    laminas: t.items.map(i => {
      const m = todos.find(x => x.title === i.titulo && (x.type ?? 'movie') === i.tipo);
      const clave = `${i.tipo}:${i.titulo}`;
      vecesVisto.set(clave, (vecesVisto.get(clave) ?? 0) + 1);
      return {
        numero: ++numero, clave, texto: i.texto, titulo: i.titulo, poster: i.poster, href: hrefTitulo({ title: i.titulo, type: i.tipo }),
        rareza: rareza(m), vez: vecesVisto.get(clave)!,
        datos: { nivel: i.nivel, palabras: i.palabras, lineas: i.lineas, comprension: i.comprension, duracion: i.duracion, episodios: i.episodios },
        realeza: m ? getRealezaDeTitulo(m).map(({ nombre, foto, rango }) => ({ nombre, foto, rango })) : [],
      };
    }),
  }));

  // Lo planificado: láminas por pegar, con el número que les tocará.
  for (const t of getTandasFuturas()) {
    paginas.push({
      id: t.id, numero: t.numero, fecha: t.fecha, anio: t.fecha.slice(0, 4), etiqueta: null, planificada: true, porConfirmar: t.porConfirmar,
      laminas: t.items.map(i => {
        const m = porTitulo.get(plano(i.titulo));
        return {
          numero: ++numero, clave: m ? `${m.type ?? 'movie'}:${m.title}` : `futuro:${i.titulo}`, texto: i.texto, titulo: i.titulo,
          poster: i.poster ?? m?.posterUrl ?? null, href: m ? hrefTitulo(m) : null, rareza: rareza(m), vez: 0, datos: null,
          realeza: m ? getRealezaDeTitulo(m).map(({ nombre, foto, rango }) => ({ nombre, foto, rango })) : [],
        };
      }),
    });
  }

  // Fecha local del build; en el navegador se cambia por la de ese día (ver useHoy).
  return <AlbumClient paginas={paginas} hoy={new Date().toLocaleDateString('sv')} />;
}
