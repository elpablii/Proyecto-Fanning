import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ArtistaClient, { type TituloEnPagina, type Vecino } from '@/components/realeza/ArtistaClient';
import { getArtista, getManifest, getProximamente, getRealeza, getTandasPorTitulo, getTodos, getVocabularioArtista } from '@/lib/data';
import { agrupar, conexiones, estadisticas, NOMBRE_RANGO, grupoDe, slugArtista, type Artista } from '@/lib/realeza';
import { comprension } from '@/lib/stats';

// Una página por cada miembro de la Realeza; cualquier otra URL da 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getRealeza().map(a => ({ slug: slugArtista(a.nombre) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const artista = getArtista(slug);
  if (!artista) return { title: 'Proyecto Fanning' };
  return {
    title: `${artista.nombre} - Proyecto Fanning`,
    description: `${NOMBRE_RANGO[grupoDe(artista)]} del Proyecto Fanning: sus títulos, su vocabulario y cuánto inglés enseñó.`,
  };
}

const vecino = (a: Artista | undefined): Vecino | null =>
  a ? { nombre: a.nombre, foto: a.foto, tipo: a.tipo, rango: a.rango } : null;

export default async function ArtistaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artista = getArtista(slug);
  if (!artista) notFound();

  const todos = getTodos();
  const stats = estadisticas(artista.nombre, todos);
  const tandas = getTandasPorTitulo();

  // Su filmografía en el orden en que entró al proyecto (lo que aún no está en una tanda va al final).
  const titulos: TituloEnPagina[] = stats.titulos
    .map(t => {
      const enTandas = tandas.get(`${t.type ?? 'movie'}:${t.title}`);
      return { ...t, tandas: enTandas?.numeros ?? [], fecha: enTandas?.fecha ?? null };
    })
    .sort((a, b) => (a.fecha ?? '9999').localeCompare(b.fecha ?? '9999') || a.title.localeCompare(b.title));
  const numerosTandas = new Set(titulos.flatMap(t => t.tandas));

  const realeza = getRealeza();
  const porNombre = new Map(realeza.map(a => [a.nombre, a]));
  const enlaces = conexiones(artista.nombre, todos)
    .filter(c => porNombre.has(c.nombre))
    .map(c => ({ ...vecino(porNombre.get(c.nombre))!, titulos: c.titulos }));

  // Para ir al anterior o al siguiente, en el orden del Salón del Trono.
  const orden = agrupar(realeza).flatMap(g => g.miembros);
  const i = orden.findIndex(a => a.nombre === artista.nombre);

  const total = getManifest()?.all;
  const comprensionProyecto = total && !Array.isArray(total) ? comprension(total.totalDialogues, total.totalWords) : null;

  return (
    <ArtistaClient
      artista={artista}
      stats={{ ...stats, titulos }}
      tandas={numerosTandas.size}
      primeraTanda={numerosTandas.size ? Math.min(...numerosTandas) : null}
      conexiones={enlaces}
      totalVocabulario={getVocabularioArtista(artista.nombre).length}
      proximos={getProximamente()[artista.nombre] ?? []}
      comprensionProyecto={comprensionProyecto}
      anterior={vecino(orden[(i - 1 + orden.length) % orden.length])}
      siguiente={vecino(orden[(i + 1) % orden.length])}
      // Fecha local del build; en el navegador se cambia por la de ese día (ver useHoy).
      hoy={new Date().toLocaleDateString('sv')}
    />
  );
}
