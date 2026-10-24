import CalendarioClient, { type CumpleCalendario, type TandaCalendario } from '@/components/calendario/CalendarioClient';
import { getLineaDeTiempo, getProximamente, getRealeza, getRealezaDeTitulo, getTandasFuturas, getTodos } from '@/lib/data';
import { hrefTitulo, ordenGrupo } from '@/lib/realeza';
import type { MovieStats } from '@/types/manifest';

export const metadata = {
  title: 'Calendario Real - Proyecto Fanning',
  description: 'El año del Proyecto Fanning en una sola vista: las tandas, los cumpleaños de la Realeza, Halloween y Navidad.',
};

const plano = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

export default function CalendarioPage() {
  const todos = getTodos();
  const porTitulo = new Map<string, MovieStats>();
  for (const m of todos) for (const t of [m.title, ...(m.aliases ?? [])]) porTitulo.set(plano(t), m);
  const realezaDe = (m: MovieStats | undefined) => m ? getRealezaDeTitulo(m).map(a => a.nombre) : [];

  const { tandas } = getLineaDeTiempo();
  const hechas: TandaCalendario[] = tandas.map(t => {
    const items = t.items.map(i => {
      const m = todos.find(x => x.title === i.titulo && (x.type ?? 'movie') === i.tipo);
      return { texto: i.texto, poster: i.poster, href: hrefTitulo({ title: i.titulo, type: i.tipo }), realeza: realezaDe(m) };
    });
    return {
      id: `${t.numero}${t.parte ?? ''}`, numero: t.numero, fecha: t.fecha, etiqueta: t.etiqueta,
      planificada: false, porConfirmar: false, items, palabras: t.palabras, duracion: t.duracion,
    };
  });

  // Lo planificado: la Realeza sale de la ficha si el título ya tiene una, y si no de "Próximamente".
  const proximamente = getProximamente();
  const enTanda = new Map<string, Set<string>>();   // id de tanda -> artistas
  for (const [nombre, obras] of Object.entries(proximamente)) {
    for (const o of obras) for (const id of o.tandas) enTanda.set(id, (enTanda.get(id) ?? new Set()).add(nombre));
  }
  const futuras: TandaCalendario[] = getTandasFuturas().map(t => ({
    id: t.id, numero: t.numero, fecha: t.fecha, etiqueta: null, planificada: true, porConfirmar: t.porConfirmar,
    palabras: null, duracion: null,
    items: t.items.map(i => {
      const m = porTitulo.get(plano(i.titulo));
      return { texto: i.texto, poster: i.poster ?? m?.posterUrl ?? null, href: m ? hrefTitulo(m) : null, realeza: realezaDe(m) };
    }),
    realezaExtra: [...(enTanda.get(t.id) ?? [])],
  }));

  const cumples: CumpleCalendario[] = getRealeza()
    .filter(a => a.nacimiento)
    .sort((a, b) => ordenGrupo(a) - ordenGrupo(b))
    .map(({ nombre, foto, tipo, rango, nacimiento, fallecimiento }) => ({ nombre, foto, tipo, rango, nacimiento: nacimiento!, fallecimiento }));

  // Fecha local del build; en el navegador se cambia por la de ese día (ver useHoy).
  return <CalendarioClient tandas={[...hechas, ...futuras]} cumples={cumples} hoy={new Date().toLocaleDateString('sv')} />;
}
