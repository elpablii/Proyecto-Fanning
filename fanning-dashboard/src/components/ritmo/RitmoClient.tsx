"use client";

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowLeft, ArrowUp, Film, Gauge, Rabbit, Search, Snail, Tv, Zap } from 'lucide-react';
import { duracion, miles } from '@/lib/formato';
import { tmdb } from '@/lib/tmdb';
import { hrefTitulo } from '@/lib/realeza';
import FondoAnimado from '@/components/ui/FondoAnimado';

export interface TituloRitmo {
  title: string;
  type: 'movie' | 'series';
  poster: string | null;
  ppm: number;                // palabras por minuto mientras hay subtítulos en pantalla (scripts/metricas/nivel.py)
  puntaje: number | null;     // nivel MCER: 1 (A1) a 6 (C2)
  level: string | null;
  minutos: number | null;
  lineas: number;
  anio: string | null;        // ciclo en que entró (su primera tanda)
}

export interface CicloRitmo {
  anio: string;
  ppm: number;                // promedio por minutos de lo que entró ese año
  titulos: number;
}

export interface EpisodioRapido {
  serie: string;
  code: string;
  name: string;
  ppm: number;
}

// Dos colores fijos (validados para daltonismo en modo oscuro y claro) y además una forma distinta:
// círculo para las películas y cuadrado para las series, así nunca depende solo del color.
const COLOR = { movie: '#ec4899', series: '#0891b2' } as const;
const NOMBRE = { movie: 'Película', series: 'Serie' } as const;
const NIVELES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const decimal = (n: number) => n.toFixed(1).replace('.', ',');

function Marca({ tipo, size = 10 }: { tipo: 'movie' | 'series'; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden className="shrink-0">
      {tipo === 'movie' ? <circle cx="5" cy="5" r="5" fill={COLOR.movie} /> : <rect width="10" height="10" rx="1.5" fill={COLOR.series} />}
    </svg>
  );
}

function Leyenda() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-300" aria-label="Leyenda">
      <li className="flex items-center gap-2"><Marca tipo="movie" /> Películas</li>
      <li className="flex items-center gap-2"><Marca tipo="series" /> Series</li>
    </ul>
  );
}

function Mediana(valores: number[]): number {
  const s = [...valores].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Coeficiente de correlación de Pearson: de −1 a 1.
function correlacion(x: number[], y: number[]): number {
  const n = x.length;
  const mx = x.reduce((s, v) => s + v, 0) / n, my = y.reduce((s, v) => s + v, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}

function lecturaCorrelacion(r: number): string {
  const a = Math.abs(r);
  if (a < 0.1) return 'Prácticamente no hay relación: un título rápido no es, por eso, más difícil.';
  const fuerza = a < 0.3 ? 'débil' : a < 0.5 ? 'moderada' : 'fuerte';
  return r > 0
    ? `Hay una relación ${fuerza}: los títulos que hablan más rápido tienden a tener un nivel un poco más alto.`
    : `Hay una relación ${fuerza} al revés: los títulos que hablan más rápido tienden a tener un nivel más bajo.`;
}

// ---------- Ranking: los más rápidos y los más pausados ----------

function Ranking({ titulo, icono: Icono, lista, max, color }: {
  titulo: string; icono: typeof Rabbit; lista: TituloRitmo[]; max: number; color: string;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-gray-900/60 p-5 sm:p-6">
      <h3 className="text-xl font-extrabold flex items-center gap-2 mb-5">
        <Icono className={color} aria-hidden /> {titulo}
      </h3>
      <ol className="space-y-2.5">
        {lista.map((t, i) => (
          <li key={`${t.type}:${t.title}`}>
            <Link href={hrefTitulo(t)} className="group grid grid-cols-[1.5rem_2rem_1fr] items-center gap-3 rounded-xl hover:bg-white/5 p-1 -m-1 transition">
              <span className="text-sm font-bold text-gray-500 text-right tabular-nums">{i + 1}</span>
              {t.poster
                ? <img src={tmdb(t.poster, 'w92')} alt="" loading="lazy" className="w-8 h-12 rounded object-cover" />
                : <span className="w-8 h-12 rounded bg-gray-800" />}
              <span className="min-w-0">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-200 group-hover:text-white truncate">{t.title}</span>
                  <span className="text-sm font-bold text-white tabular-nums shrink-0">{decimal(t.ppm)} <span className="text-[11px] font-medium text-gray-500">ppm</span></span>
                </span>
                {/* La barra parte en cero: su largo es proporcional a la velocidad */}
                <span className="mt-1.5 block h-2 rounded-full bg-white/5">
                  <span className="block h-full rounded-full" style={{ width: `${(t.ppm / max) * 100}%`, background: COLOR[t.type] }} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ---------- Dispersión: velocidad contra nivel MCER ----------

const W = 800, H = 440;
const M = { izq: 44, der: 16, arr: 16, abj: 44 };

function Dispersion({ titulos, mediana }: { titulos: (TituloRitmo & { puntaje: number })[]; mediana: number }) {
  const router = useRouter();
  const svg = useRef<SVGSVGElement>(null);
  const [encima, setEncima] = useState<number | null>(null);

  const ppms = titulos.map(t => t.ppm), puntajes = titulos.map(t => t.puntaje);
  const x0 = Math.floor(Math.min(...ppms) / 10) * 10, x1 = Math.ceil(Math.max(...ppms) / 10) * 10;
  const y0 = Math.max(1, Math.floor(Math.min(...puntajes) * 2) / 2 - 0.25), y1 = Math.min(6, Math.ceil(Math.max(...puntajes) * 2) / 2 + 0.25);
  const sx = (v: number) => M.izq + ((v - x0) / (x1 - x0)) * (W - M.izq - M.der);
  const sy = (v: number) => H - M.abj - ((v - y0) / (y1 - y0)) * (H - M.arr - M.abj);
  const ticksX = Array.from({ length: Math.floor((x1 - x0) / 20) + 1 }, (_, i) => x0 + i * 20);
  const ticksY = NIVELES.map((n, i) => ({ n, v: i + 1 })).filter(t => t.v >= y0 && t.v <= y1);

  // El punto más cercano al puntero (los puntos son chicos: no hace falta acertarles justo).
  const mover = (e: React.PointerEvent<SVGSVGElement>) => {
    const caja = svg.current!.getBoundingClientRect();
    const px = ((e.clientX - caja.left) / caja.width) * W, py = ((e.clientY - caja.top) / caja.height) * H;
    let mejor = -1, distancia = 28 ** 2;
    titulos.forEach((t, i) => {
      const d = (sx(t.ppm) - px) ** 2 + (sy(t.puntaje) - py) ** 2;
      if (d < distancia) { distancia = d; mejor = i; }
    });
    setEncima(mejor >= 0 ? mejor : null);
  };
  const activo = encima !== null ? titulos[encima] : null;

  return (
    <div className="relative">
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none touch-none" role="img"
        aria-label="Gráfico de dispersión: velocidad de habla contra nivel MCER de cada título. Los datos están en la tabla de abajo."
        onPointerMove={mover} onPointerLeave={() => setEncima(null)}
        onClick={() => activo && router.push(hrefTitulo(activo))}
        style={{ cursor: activo ? 'pointer' : 'default' }}>
        {/* Rejilla y ejes */}
        {ticksY.map(t => (
          <g key={t.n}>
            <line x1={M.izq} x2={W - M.der} y1={sy(t.v)} y2={sy(t.v)} stroke="var(--color-gray-800)" strokeWidth="1" />
            <text x={M.izq - 8} y={sy(t.v)} textAnchor="end" dominantBaseline="middle" fontSize="12" fill="var(--color-gray-400)">{t.n}</text>
          </g>
        ))}
        {ticksX.map(v => (
          <text key={v} x={sx(v)} y={H - M.abj + 18} textAnchor="middle" fontSize="12" fill="var(--color-gray-400)" className="tabular-nums">{v}</text>
        ))}
        <line x1={M.izq} x2={W - M.der} y1={H - M.abj} y2={H - M.abj} stroke="var(--color-gray-700)" strokeWidth="1" />
        <text x={(M.izq + W - M.der) / 2} y={H - 6} textAnchor="middle" fontSize="12" fill="var(--color-gray-500)">Palabras por minuto →</text>

        {/* La mediana del proyecto */}
        <line x1={sx(mediana)} x2={sx(mediana)} y1={M.arr} y2={H - M.abj} stroke="var(--color-gray-500)" strokeWidth="1" />
        <text x={sx(mediana) + 6} y={M.arr + 10} fontSize="11" fill="var(--color-gray-400)">Mediana: {decimal(mediana)} ppm</text>

        {/* Puntos: el activo va al final para quedar encima */}
        {[...titulos.keys()].sort((a, b) => Number(a === encima) - Number(b === encima)).map(i => {
          const t = titulos[i], x = sx(t.ppm), y = sy(t.puntaje), on = i === encima;
          const r = on ? 7 : 4.5;
          return t.type === 'movie'
            ? <circle key={i} cx={x} cy={y} r={r} fill={COLOR.movie} stroke="var(--background)" strokeWidth="2" opacity={encima === null || on ? 1 : 0.45} />
            : <rect key={i} x={x - r} y={y - r} width={r * 2} height={r * 2} rx="1.5" fill={COLOR.series} stroke="var(--background)" strokeWidth="2" opacity={encima === null || on ? 1 : 0.45} />;
        })}
      </svg>

      {activo && (
        <div className="pointer-events-none absolute z-10 w-56 rounded-xl border border-white/15 bg-gray-950/95 shadow-2xl p-3 flex gap-3"
          style={{
            left: `${(sx(activo.ppm) / W) * 100}%`, top: `${(sy(activo.puntaje) / H) * 100}%`,
            transform: `translate(${sx(activo.ppm) > W * 0.65 ? 'calc(-100% - 14px)' : '14px'}, -50%)`,
          }}>
          {activo.poster && <img src={tmdb(activo.poster, 'w92')} alt="" className="w-10 h-15 rounded object-cover shrink-0" />}
          <div className="min-w-0 text-sm">
            <p className="font-bold text-white leading-tight">{activo.title}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5"><Marca tipo={activo.type} size={8} /> {NOMBRE[activo.type]}</p>
            <p className="text-gray-200 mt-1 tabular-nums">{decimal(activo.ppm)} ppm · {activo.level}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Ritmo de cada ciclo ----------

function Ciclos({ ciclos, mediana }: { ciclos: CicloRitmo[]; mediana: number }) {
  // Un punto sobre una escala (no una barra), así el eje puede empezar donde están los datos.
  const v = ciclos.map(c => c.ppm);
  const a = Math.floor(Math.min(...v, mediana) / 10) * 10 - 10, b = Math.ceil(Math.max(...v, mediana) / 10) * 10 + 10;
  const pos = (n: number) => `${((n - a) / (b - a)) * 100}%`;
  return (
    <div>
      <ul className="space-y-4">
        {ciclos.map(c => (
          <li key={c.anio} className="grid grid-cols-[4rem_1fr_4.5rem] items-center gap-3">
            <span className="font-bold text-gray-200">{c.anio}</span>
            <span className="relative h-8">
              <span className="absolute inset-x-0 top-1/2 h-px bg-gray-800" />
              <span className="absolute top-1 bottom-1 w-px bg-gray-500" style={{ left: pos(mediana) }} title={`Mediana de todos los títulos: ${decimal(mediana)} ppm`} />
              <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-violet-400 ring-2 ring-gray-950" style={{ left: pos(c.ppm) }} />
            </span>
            <span className="text-right text-sm font-bold text-white tabular-nums">{decimal(c.ppm)}</span>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-[4rem_1fr_4.5rem] gap-3 mt-2 text-[11px] text-gray-500">
        <span />
        <span className="flex justify-between tabular-nums"><span>{a} ppm</span><span>{b} ppm</span></span>
        <span />
      </div>
      <p className="text-xs text-gray-500 mt-3 flex items-center gap-2">
        <span className="inline-block w-px h-3 bg-gray-500" /> Mediana de todos los títulos ({decimal(mediana)} ppm)
      </p>
    </div>
  );
}

// ---------- Tabla completa ----------

type Columna = 'title' | 'ppm' | 'puntaje' | 'minutos';

function Tabla({ titulos }: { titulos: TituloRitmo[] }) {
  const [orden, setOrden] = useState<{ col: Columna; desc: boolean }>({ col: 'ppm', desc: true });
  const [tipo, setTipo] = useState<'todos' | 'movie' | 'series'>('todos');
  const [q, setQ] = useState('');
  const filas = useMemo(() => {
    const plano = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const lista = titulos.filter(t => (tipo === 'todos' || t.type === tipo) && plano(t.title).includes(plano(q.trim())));
    const valor = (t: TituloRitmo) => (orden.col === 'title' ? t.title : t[orden.col] ?? -1);
    return lista.sort((a, b) => {
      const va = valor(a), vb = valor(b);
      const c = typeof va === 'string' ? va.localeCompare(vb as string) : va - (vb as number);
      return orden.desc ? -c : c;
    });
  }, [titulos, orden, tipo, q]);
  // Puesto de cada título por velocidad (1 = el más rápido), fijo aunque se ordene distinto.
  const puesto = useMemo(() => new Map([...titulos].sort((a, b) => b.ppm - a.ppm).map((t, i) => [`${t.type}:${t.title}`, i + 1])), [titulos]);

  const encabezado = (col: Columna, children: React.ReactNode, className = '') => (
    <th scope="col" key={col} className={`py-2 px-3 font-semibold ${className}`} aria-sort={orden.col === col ? (orden.desc ? 'descending' : 'ascending') : 'none'}>
      <button onClick={() => setOrden(o => ({ col, desc: o.col === col ? !o.desc : col !== 'title' }))}
        className="inline-flex items-center gap-1 hover:text-white transition">
        {children}
        {orden.col === col && (orden.desc ? <ArrowDown size={13} /> : <ArrowUp size={13} />)}
      </button>
    </th>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <label className="relative flex-1">
          <span className="sr-only">Buscar un título</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden />
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar un título…"
            className="w-full rounded-xl bg-gray-900/80 border border-white/10 pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-cyan-400/60" />
        </label>
        <div className="flex rounded-xl bg-gray-900/80 border border-white/10 p-1 text-sm">
          {([['todos', 'Todos'], ['movie', 'Películas'], ['series', 'Series']] as const).map(([v, t]) => (
            <button key={v} onClick={() => setTipo(v)} aria-pressed={tipo === v}
              className={`px-3 py-1 rounded-lg font-semibold transition ${tipo === v ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <div className="max-h-[32rem] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900 text-gray-400 text-left">
              <tr>
                <th scope="col" className="py-2 px-3 font-semibold w-12 text-right">#</th>
                {encabezado('title', 'Título')}
                {encabezado('ppm', 'Palabras/min', 'text-right')}
                {encabezado('puntaje', 'Nivel', 'text-right')}
                {encabezado('minutos', 'Duración', 'text-right hidden sm:table-cell')}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filas.map(t => (
                <tr key={`${t.type}:${t.title}`} className="hover:bg-white/[0.03]">
                  <td className="py-2 px-3 text-right text-gray-500 tabular-nums">{puesto.get(`${t.type}:${t.title}`)}</td>
                  <td className="py-2 px-3">
                    <Link href={hrefTitulo(t)} className="inline-flex items-center gap-2 text-gray-200 hover:text-white">
                      <Marca tipo={t.type} size={9} /> {t.title}
                    </Link>
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-white tabular-nums">{decimal(t.ppm)}</td>
                  <td className="py-2 px-3 text-right text-gray-300">{t.level ?? '—'}</td>
                  <td className="py-2 px-3 text-right text-gray-400 hidden sm:table-cell tabular-nums">{duracion(t.minutos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">{miles(filas.length)} de {miles(titulos.length)} títulos</p>
    </div>
  );
}

export default function RitmoClient({ titulos, ciclos, episodioRapido }: {
  titulos: TituloRitmo[];
  ciclos: CicloRitmo[];
  episodioRapido: EpisodioRapido | null;
}) {
  const porVelocidad = useMemo(() => [...titulos].sort((a, b) => b.ppm - a.ppm), [titulos]);
  const mediana = useMemo(() => Mediana(titulos.map(t => t.ppm)), [titulos]);
  const conNivel = useMemo(() => titulos.filter((t): t is TituloRitmo & { puntaje: number } => t.puntaje !== null), [titulos]);
  const r = useMemo(() => correlacion(conNivel.map(t => t.ppm), conNivel.map(t => t.puntaje)), [conNivel]);
  const max = porVelocidad[0]?.ppm ?? 1;
  const masRapido = porVelocidad[0], masLento = porVelocidad[porVelocidad.length - 1];

  return (
    <div className="min-h-screen text-gray-100 font-sans">
      <FondoAnimado paleta="ritmo" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition mb-6 text-sm font-medium">
          <ArrowLeft size={16} className="mr-2" /> Volver al inicio
        </Link>

        <header className="text-center mb-10 animate-fade-in">
          <Gauge size={40} className="mx-auto text-cyan-300 mb-3" aria-hidden />
          <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-linear-to-r from-cyan-200 via-pink-300 to-violet-300 bg-clip-text text-transparent brillo-titulo pb-1">
            El Ritmo del Inglés
          </h1>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto md:text-lg">
            ¿A qué velocidad se habla en cada título? Se cuentan las palabras de los subtítulos y se dividen por el tiempo
            que están en pantalla: son las <strong className="text-gray-200">palabras por minuto</strong> (ppm) mientras alguien habla.
          </p>
        </header>

        {masRapido && masLento && (
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-12">
            {[
              { icono: Gauge, etiqueta: 'Mediana de todos los títulos', valor: `${decimal(mediana)} ppm`, nota: `${miles(titulos.length)} títulos`, color: 'text-violet-300' },
              { icono: Rabbit, etiqueta: 'El más rápido', valor: `${decimal(masRapido.ppm)} ppm`, nota: masRapido.title, color: 'text-pink-300', href: hrefTitulo(masRapido) },
              { icono: Snail, etiqueta: 'El más pausado', valor: `${decimal(masLento.ppm)} ppm`, nota: masLento.title, color: 'text-cyan-300', href: hrefTitulo(masLento) },
              ...(episodioRapido ? [{
                icono: Zap, etiqueta: 'El episodio más rápido', valor: `${decimal(episodioRapido.ppm)} ppm`,
                nota: `${episodioRapido.serie} · ${episodioRapido.code}`, color: 'text-amber-300',
                href: hrefTitulo({ title: episodioRapido.serie, type: 'series' }),
              }] : []),
            ].map(c => {
              const contenido = (
                <>
                  <c.icono size={18} className={`${c.color} mb-2`} aria-hidden />
                  <dd className="text-2xl font-extrabold text-white leading-none">{c.valor}</dd>
                  <dt className={`text-[11px] uppercase tracking-wider font-semibold mt-1.5 ${c.color}`}>{c.etiqueta}</dt>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{c.nota}</p>
                </>
              );
              return 'href' in c && c.href
                ? <Link key={c.etiqueta} href={c.href} className="rounded-2xl border border-white/10 bg-gray-900/60 hover:border-white/25 p-4 transition">{contenido}</Link>
                : <div key={c.etiqueta} className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">{contenido}</div>;
            })}
          </dl>
        )}

        <div className="flex justify-end mb-4"><Leyenda /></div>
        <div className="grid lg:grid-cols-2 gap-6 mb-14">
          <Ranking titulo="Los diálogos más rápidos" icono={Rabbit} lista={porVelocidad.slice(0, 10)} max={max} color="text-pink-300" />
          <Ranking titulo="Los más pausados" icono={Snail} lista={porVelocidad.slice(-10).reverse()} max={max} color="text-cyan-300" />
        </div>

        <section aria-labelledby="dispersion" className="mb-14 rounded-3xl border border-white/10 bg-gray-900/60 p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
            <h2 id="dispersion" className="text-2xl font-extrabold">¿Hablar más rápido hace más difícil el inglés?</h2>
            <Leyenda />
          </div>
          <p className="text-gray-400 text-sm mb-1">
            Cada punto es un título: a la derecha, los que hablan más rápido; arriba, los de nivel MCER más alto.
            Pasa el mouse sobre un punto para ver cuál es y tócalo para abrir su ficha.
          </p>
          <p className="text-sm text-gray-200 mb-4">
            {lecturaCorrelacion(r)} <span className="text-gray-500">(correlación: {r.toFixed(2).replace('.', ',')})</span>
          </p>
          {conNivel.length > 1 && <Dispersion titulos={conNivel} mediana={mediana} />}
        </section>

        {ciclos.length > 0 && (
          <section aria-labelledby="ciclos" className="mb-14 rounded-3xl border border-white/10 bg-gray-900/60 p-5 sm:p-6">
            <h2 id="ciclos" className="text-2xl font-extrabold mb-1">El ritmo de cada ciclo</h2>
            <p className="text-gray-400 text-sm mb-6">
              La velocidad promedio de lo que se vio cada año (en las series, solo los episodios de ese año), pesada por minutos.
            </p>
            <Ciclos ciclos={ciclos} mediana={mediana} />
          </section>
        )}

        <section aria-labelledby="tabla" className="mb-6">
          <h2 id="tabla" className="text-2xl font-extrabold mb-1 flex items-center gap-2">
            <Film className="text-pink-300" aria-hidden /><Tv className="text-cyan-300" aria-hidden /> Todos los títulos
          </h2>
          <p className="text-gray-400 text-sm mb-4">Toca un encabezado para ordenar. El número es el puesto por velocidad.</p>
          <Tabla titulos={titulos} />
        </section>
      </div>
    </div>
  );
}
