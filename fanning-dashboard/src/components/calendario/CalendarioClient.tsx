"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Cake, CalendarHeart, Check, Clock, Film, Ghost, Gift, PartyPopper, Sparkles, type LucideIcon } from 'lucide-react';
import { duracion, miles } from '@/lib/formato';
import { tmdb } from '@/lib/tmdb';
import { hrefArtista, numeroDeDia, type Artista } from '@/lib/realeza';
import { edad, fechaLarga, useHoy } from '@/components/realeza/Cumpleanos';
import FondoAnimado from '@/components/ui/FondoAnimado';

export interface ItemCalendario {
  texto: string;
  poster: string | null;
  href: string | null;        // null si el título todavía no tiene ficha
  realeza: string[];
}

export interface TandaCalendario {
  id: string;                 // "14a", "74"
  numero: number;
  fecha: string;
  etiqueta: 'gala' | 'navidad' | 'fin' | null;
  planificada: boolean;       // del txt de planificación, todavía sin vocabulario contado
  porConfirmar: boolean;
  items: ItemCalendario[];
  palabras: number | null;
  duracion: number | null;
  realezaExtra?: string[];    // planificadas: quién viene según "Próximamente"
}

export type CumpleCalendario = Pick<Artista, 'nombre' | 'foto' | 'tipo' | 'rango' | 'fallecimiento'> & { nacimiento: string };

type Festivo = { nombre: string; icono: LucideIcon; clase: string; detalle?: string };

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const INICIO = 2023;          // el proyecto empezó formalmente el 15/10/2023

const iso = (a: number, m: number, d: number) => `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const diasDelMes = (a: number, m: number) => new Date(Date.UTC(a, m, 0)).getUTCDate();
const nombreTanda = (t: TandaCalendario) => `${t.id}° Tanda`;
const realezaDeTanda = (t: TandaCalendario) => new Set([...t.items.flatMap(i => i.realeza), ...(t.realezaExtra ?? [])]);

// El cumpleaños en un año dado (el 29 de febrero se celebra el 28 los años que no son bisiestos).
function cumpleEn(nacimiento: string, anio: number): string {
  const [, m, d] = nacimiento.split('-').map(Number);
  return iso(anio, m, Math.min(d, diasDelMes(anio, m)));
}

function festivos(anio: number): Record<string, Festivo> {
  const f: Record<string, Festivo> = {
    [iso(anio, 10, 31)]: { nombre: 'Halloween', icono: Ghost, clase: 'text-orange-300' },
    [iso(anio, 12, 25)]: { nombre: 'Navidad', icono: Gift, clase: 'text-red-300' },
    [iso(anio, 12, 31)]: { nombre: 'Fin de Año', icono: PartyPopper, clase: 'text-yellow-300' },
  };
  if (anio >= INICIO) {
    f[iso(anio, 10, 15)] = {
      nombre: anio === INICIO ? 'Inicio del Proyecto Fanning' : `${anio - INICIO} ${anio - INICIO === 1 ? 'año' : 'años'} del Proyecto Fanning`,
      icono: Sparkles, clase: 'text-purple-300',
    };
  }
  return f;
}

// La tanda más cercana a una fecha (Reglas: los cumpleaños y Halloween van en la tanda más cercana).
function masCercana(tandas: TandaCalendario[], fecha: string): TandaCalendario | null {
  const dia = numeroDeDia(fecha);
  let mejor: TandaCalendario | null = null;
  for (const t of tandas) {
    if (!mejor || Math.abs(numeroDeDia(t.fecha) - dia) < Math.abs(numeroDeDia(mejor.fecha) - dia)) mejor = t;
  }
  return mejor;
}

function Rostro({ a, tamano = 'w-8 h-8' }: { a: Pick<Artista, 'nombre' | 'foto' | 'rango'>; tamano?: string }) {
  return a.foto
    ? <img src={tmdb(a.foto, 'w92')} alt="" loading="lazy" className={`${tamano} rounded-full object-cover object-top border-2 shrink-0 ${a.rango === 'platonico' ? 'border-pink-400' : a.rango === 'supremo' ? 'border-amber-300' : 'border-gray-800'}`} />
    : <span className={`${tamano} rounded-full bg-gray-800 flex items-center justify-center shrink-0`}><Cake size={12} /></span>;
}

function TarjetaTanda({ t }: { t: TandaCalendario }) {
  return (
    <div className={`rounded-xl border p-3 ${t.planificada ? 'border-dashed border-purple-400/40 bg-purple-500/5' : 'border-blue-400/30 bg-blue-500/5'}`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="font-bold text-white">{nombreTanda(t)}</span>
        {t.numero === 100 && <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-400/30">Centenario</span>}
        {t.etiqueta === 'gala' && <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-400/30">Gala</span>}
        {t.etiqueta === 'fin' && <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 bg-yellow-500/15 text-yellow-300 border border-yellow-400/30">Fin de Año</span>}
        {t.etiqueta === 'navidad' && <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 bg-red-500/15 text-red-300 border border-red-400/30">Navidad</span>}
        <span className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${t.planificada ? 'bg-purple-500/15 text-purple-300' : 'bg-blue-500/15 text-blue-300'}`}>
          {t.planificada ? (t.porConfirmar ? 'Planificada · por confirmar' : 'Planificada') : 'Con vocabulario'}
        </span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {t.items.map((i, k) => {
          const poster = i.poster
            ? <img src={tmdb(i.poster, 'w92')} alt="" loading="lazy" className="w-12 h-[72px] rounded-md object-cover border border-white/10" />
            : <span className="w-12 h-[72px] rounded-md bg-gray-800 border border-white/10 flex items-center justify-center text-gray-500"><Film size={14} /></span>;
          return (
            <li key={k} className="w-24">
              {i.href ? <Link href={i.href} className="block hover:scale-105 transition w-fit">{poster}</Link> : poster}
              <p className="text-[11px] text-gray-300 mt-1 leading-tight line-clamp-3">{i.texto}</p>
            </li>
          );
        })}
      </ul>
      {t.palabras !== null && (
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-3">
          <span>{miles(t.palabras)} palabras</span>
          <span className="flex items-center gap-1"><Clock size={11} aria-hidden /> {duracion(t.duracion)}</span>
        </p>
      )}
    </div>
  );
}

export default function CalendarioClient({ tandas, cumples, hoy: hoyBuild }: {
  tandas: TandaCalendario[];
  cumples: CumpleCalendario[];
  hoy: string;
}) {
  const hoy = useHoy(hoyBuild);
  const anios = useMemo(() => [...new Set(tandas.map(t => Number(t.fecha.slice(0, 4))))].sort(), [tandas]);
  const anioHoy = Number(hoy.slice(0, 4));
  const [anio, setAnio] = useState(anios.includes(anioHoy) ? anioHoy : anios[anios.length - 1]);
  const [elegido, setElegido] = useState<string | null>(null);

  const delAnio = useMemo(() => tandas.filter(t => t.fecha.startsWith(`${anio}-`)).sort((a, b) => a.fecha.localeCompare(b.fecha)), [tandas, anio]);
  const fijos = useMemo(() => festivos(anio), [anio]);

  // Todo lo que pasa cada día del año.
  const porDia = useMemo(() => {
    const mapa = new Map<string, { tandas: TandaCalendario[]; cumples: CumpleCalendario[]; festivo?: Festivo }>();
    const de = (f: string) => mapa.get(f) ?? (mapa.set(f, { tandas: [], cumples: [] }), mapa.get(f)!);
    for (const t of delAnio) de(t.fecha).tandas.push(t);
    for (const c of cumples) de(cumpleEn(c.nacimiento, anio)).cumples.push(c);
    for (const [f, festivo] of Object.entries(fijos)) de(f).festivo = festivo;
    return mapa;
  }, [delAnio, cumples, fijos, anio]);

  // Cada cumpleaños con la tanda más cercana de ese año y si el artista está en ella.
  const cumplesDelAnio = useMemo(() => cumples
    .map(c => {
      const fecha = cumpleEn(c.nacimiento, anio);
      const tanda = masCercana(delAnio, fecha);
      return { ...c, fecha, tanda, celebrado: !!tanda && realezaDeTanda(tanda).has(c.nombre) };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha)), [cumples, delAnio, anio]);

  // Lo que viene desde hoy (tandas, cumpleaños y fechas especiales), mirando hasta un año adelante.
  const proximos = useMemo(() => {
    const lista: { fecha: string; texto: string; icono: LucideIcon; clase: string }[] = [];
    const desde = numeroDeDia(hoy);
    const enRango = (f: string) => numeroDeDia(f) >= desde && numeroDeDia(f) - desde <= 366;
    for (const t of tandas) if (enRango(t.fecha)) lista.push({ fecha: t.fecha, texto: nombreTanda(t), icono: CalendarHeart, clase: t.planificada ? 'text-purple-300' : 'text-blue-300' });
    for (const a of [anioHoy, anioHoy + 1]) {
      for (const c of cumples) {
        const f = cumpleEn(c.nacimiento, a);
        if (enRango(f)) lista.push({ fecha: f, texto: c.fallecimiento ? `Natalicio de ${c.nombre}` : `${c.nombre} cumple ${edad(c.nacimiento, f)}`, icono: Cake, clase: 'text-pink-300' });
      }
      for (const [f, x] of Object.entries(festivos(a))) if (enRango(f)) lista.push({ fecha: f, texto: x.nombre, icono: x.icono, clase: x.clase });
    }
    return lista.sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 8);
  }, [tandas, cumples, hoy, anioHoy]);

  const diaElegido = elegido && elegido.startsWith(`${anio}-`) ? elegido
    : hoy.startsWith(`${anio}-`) ? hoy : delAnio[0]?.fecha ?? iso(anio, 1, 1);
  const detalle = porDia.get(diaElegido);
  const halloween = masCercana(delAnio, iso(anio, 10, 31));
  const navidad = delAnio.find(t => t.etiqueta === 'navidad' || t.fecha === iso(anio, 12, 25));
  const hechas = delAnio.filter(t => !t.planificada);
  const BOTON = 'px-4 py-1.5 rounded-full text-sm font-medium transition';

  return (
    <div className="min-h-screen text-gray-100 font-sans">
      <FondoAnimado paleta="calendario" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <Link transitionTypes={['atras']} href="/" className="inline-flex items-center text-gray-400 hover:text-white transition mb-6 text-sm font-medium">
          <ArrowLeft size={16} className="mr-2" /> Volver al inicio
        </Link>

        <header className="mb-8 animate-fade-in">
          <h1 className="font-real text-4xl md:text-6xl font-bold bg-linear-to-r from-pink-300 via-amber-200 to-sky-300 bg-clip-text text-transparent brillo-titulo flex items-center gap-3">
            <CalendarHeart className="text-pink-300 shrink-0" size={44} aria-hidden /> Calendario Real
          </h1>
          <p className="text-gray-400 mt-3 max-w-3xl md:text-lg">
            El año del proyecto en una sola vista: cada tanda, los cumpleaños de la Realeza y las fechas que mandan
            contenido temático. Toca un día para ver qué pasa en él.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-2 mb-6" role="group" aria-label="Año">
          {anios.map(a => (
            <button key={a} onClick={() => { setAnio(a); setElegido(null); }} aria-pressed={anio === a}
              className={`${BOTON} ${anio === a ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/40' : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              {a}
            </button>
          ))}
        </div>

        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            ['Tandas', `${delAnio.length}`, hechas.length < delAnio.length ? `${hechas.length} con vocabulario · ${delAnio.length - hechas.length} planificadas` : 'todas con vocabulario', 'text-blue-300'],
            ['Cumpleaños', `${cumplesDelAnio.length}`, `${cumplesDelAnio.filter(c => c.celebrado).length} con su artista en la tanda más cercana`, 'text-pink-300'],
            ['Halloween', halloween ? nombreTanda(halloween) : '—', 'la tanda más cercana al 31/10', 'text-orange-300'],
            ['Navidad', navidad ? nombreTanda(navidad) : '—', 'contenido navideño', 'text-red-300'],
          ].map(([etiqueta, valor, nota, clase]) => (
            <div key={etiqueta} className="rounded-xl border border-white/10 bg-gray-900/60 px-4 py-3">
              <dt className="text-xs text-gray-400">{etiqueta}</dt>
              <dd className={`text-xl font-extrabold ${clase}`}>{valor}</dd>
              <dd className="text-[11px] text-gray-500 leading-snug">{nota}</dd>
            </div>
          ))}
        </dl>

        <div className="grid lg:grid-cols-[1fr_22rem] gap-8 items-start">
          <div>
            {/* Leyenda */}
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400 mb-4">
              <li className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-blue-400" /> Tanda con vocabulario</li>
              <li className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-dashed border-purple-400" /> Tanda planificada</li>
              <li className="flex items-center gap-1.5"><Cake size={12} className="text-pink-300" /> Cumpleaños</li>
              <li className="flex items-center gap-1.5"><Ghost size={12} className="text-orange-300" /> Halloween</li>
              <li className="flex items-center gap-1.5"><Gift size={12} className="text-red-300" /> Navidad</li>
              <li className="flex items-center gap-1.5"><Sparkles size={12} className="text-purple-300" /> Aniversario</li>
            </ul>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {MESES.map((nombre, m) => {
                const total = diasDelMes(anio, m + 1);
                const vacios = (new Date(Date.UTC(anio, m, 1)).getUTCDay() + 6) % 7;   // la semana empieza el lunes
                return (
                  <section key={nombre} aria-label={`${nombre} de ${anio}`} className="rounded-2xl border border-white/10 bg-gray-900/60 p-3">
                    <h2 className="font-bold text-sm text-gray-200 mb-2 px-1">{nombre}</h2>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {DIAS.map((d, i) => <span key={i} className="text-[10px] text-gray-500 font-semibold">{d}</span>)}
                      {Array.from({ length: vacios }, (_, i) => <span key={`v${i}`} />)}
                      {Array.from({ length: total }, (_, i) => {
                        const fecha = iso(anio, m + 1, i + 1);
                        const ev = porDia.get(fecha);
                        const tanda = ev?.tandas[0];
                        const esHoy = fecha === hoy;
                        const marco = tanda ? (tanda.planificada ? 'border-2 border-dashed border-purple-400/80' : 'border-2 border-blue-400/80') : 'border border-transparent';
                        const anillo = fecha === diaElegido ? 'ring-2 ring-pink-400' : esHoy ? 'ring-2 ring-white/70' : '';
                        const contenido = (
                          <>
                            {tanda?.items[0]?.poster && (
                              <img src={tmdb(tanda.items[0].poster, 'w92')} alt="" aria-hidden loading="lazy"
                                className={`absolute inset-0 w-full h-full object-cover rounded-[5px] ${tanda.planificada ? 'opacity-35 grayscale-[40%]' : 'opacity-55'}`} />
                            )}
                            <span className={`relative text-[11px] font-semibold ${tanda ? 'text-white drop-shadow' : esHoy ? 'text-white' : 'text-gray-400'}`}>{i + 1}</span>
                            {ev?.festivo && <ev.festivo.icono size={10} className={`absolute top-0.5 right-0.5 ${ev.festivo.clase}`} aria-hidden />}
                            {ev && ev.cumples.length > 0 && (
                              <span className="absolute -bottom-1 -right-1 flex">
                                {ev.cumples[0].foto
                                  ? <img src={tmdb(ev.cumples[0].foto, 'w92')} alt="" aria-hidden loading="lazy" className="w-4 h-4 rounded-full object-cover object-top border border-pink-400" />
                                  : <Cake size={12} className="text-pink-300" aria-hidden />}
                              </span>
                            )}
                          </>
                        );
                        const clase = `relative aspect-square rounded-md flex items-center justify-center ${marco} ${anillo}`;
                        if (!ev) return <span key={fecha} className={clase}>{contenido}</span>;
                        const resumen = [...ev.tandas.map(nombreTanda), ...ev.cumples.map(c => `Cumpleaños de ${c.nombre}`), ev.festivo?.nombre].filter(Boolean).join(', ');
                        return (
                          <button key={fecha} onClick={() => setElegido(fecha)} aria-pressed={fecha === diaElegido}
                            aria-label={`${fechaLarga(fecha)}: ${resumen}`} title={resumen}
                            className={`${clase} hover:scale-110 hover:z-10 transition ${!tanda ? 'bg-white/5' : ''}`}>
                            {contenido}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6">
            {/* El día elegido */}
            <section className="rounded-2xl border border-white/10 bg-gray-900/80 p-4" aria-live="polite">
              <h2 className="font-bold text-lg text-white mb-3">{fechaLarga(diaElegido, true)}</h2>
              {!detalle ? (
                <p className="text-sm text-gray-400">Nada especial este día.</p>
              ) : (
                <div className="space-y-3">
                  {detalle.festivo && (
                    <p className={`flex items-center gap-2 font-semibold ${detalle.festivo.clase}`}>
                      <detalle.festivo.icono size={16} aria-hidden /> {detalle.festivo.nombre}
                    </p>
                  )}
                  {detalle.cumples.map(c => {
                    const info = cumplesDelAnio.find(x => x.nombre === c.nombre);
                    return (
                      <div key={c.nombre} className="flex items-center gap-3">
                        <Rostro a={c} tamano="w-11 h-11" />
                        <div className="text-sm">
                          <Link href={hrefArtista(c.nombre)} className="font-semibold text-pink-200 hover:underline">{c.nombre}</Link>
                          <p className="text-gray-400 text-xs">
                            {c.fallecimiento ? `Habría cumplido ${edad(c.nacimiento, diaElegido)} años` : `Cumple ${edad(c.nacimiento, diaElegido)} años`}
                          </p>
                          {info?.tanda && (
                            <p className={`text-xs ${info.celebrado ? 'text-emerald-300' : 'text-gray-500'}`}>
                              {info.celebrado ? `Está en la ${nombreTanda(info.tanda)}` : `No está en la tanda más cercana (${nombreTanda(info.tanda)})`}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {detalle.tandas.map(t => <TarjetaTanda key={t.id} t={t} />)}
                </div>
              )}
            </section>

            {/* Lo que viene */}
            <section className="rounded-2xl border border-white/10 bg-gray-900/80 p-4">
              <h2 className="font-bold text-white mb-3">Lo que viene</h2>
              <ol className="space-y-2">
                {proximos.map((p, i) => (
                  <li key={i}>
                    <button onClick={() => { setAnio(Number(p.fecha.slice(0, 4))); setElegido(p.fecha); }}
                      className="w-full flex items-center gap-3 text-left text-sm rounded-lg px-2 py-1.5 hover:bg-white/5 transition">
                      <p.icono size={15} className={`${p.clase} shrink-0`} aria-hidden />
                      <span className="flex-1 text-gray-200">{p.texto}</span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{p.fecha === hoy ? 'Hoy' : fechaLarga(p.fecha)}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>

        {/* Los cumpleaños del año, con la tanda más cercana */}
        <section className="mt-12" aria-labelledby="cumples">
          <h2 id="cumples" className="font-real text-2xl md:text-3xl font-bold text-pink-200 flex items-center gap-2 mb-2">
            <Cake className="text-pink-300" aria-hidden /> Los cumpleaños de {anio}
          </h2>
          <p className="text-sm text-gray-400 mb-5 max-w-3xl">
            La regla es flexible: el cumpleaños se celebra con un título del artista en la tanda más cercana, cuando se puede.
            El check verde marca los que ya quedaron.
          </p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cumplesDelAnio.map(c => (
              <li key={c.nombre}>
                <button onClick={() => setElegido(c.fecha)}
                  className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-gray-900/60 hover:bg-gray-800/80 p-3 text-left transition">
                  <Rostro a={c} tamano="w-10 h-10" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-white truncate">{c.nombre}</span>
                    <span className="block text-xs text-gray-400">{fechaLarga(c.fecha)} · {c.tanda ? nombreTanda(c.tanda) : 'sin tandas'}</span>
                  </span>
                  {c.celebrado && <Check size={18} className="text-emerald-400 shrink-0" aria-label="Está en la tanda más cercana" />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
