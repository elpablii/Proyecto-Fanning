import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowUp, BookOpen, BookText, Calculator, CalendarDays, Check, ChevronRight, CircleHelp, Clapperboard,
  Clock, Crown, Eye, Film, Heart, Library, Lightbulb, ListChecks, MessageSquare, Ruler, ScrollText, ShieldAlert, Sparkles, Star,
  Tags, Timer, X,
} from 'lucide-react';
import IndiceSecciones, { type Seccion } from '@/components/reglas/IndiceSecciones';
import CalculadoraComprension from '@/components/reglas/CalculadoraComprension';
import GlosarioEtiquetas from '@/components/reglas/GlosarioEtiquetas';
import { getDatosConstitucion, type Aparicion } from '@/lib/constitucion';
import { agrupar } from '@/lib/realeza';
import { getRealeza } from '@/lib/data';
import { duracion, miles, porcentaje } from '@/lib/formato';
import FondoAnimado from '@/components/ui/FondoAnimado';

export const metadata = {
  title: 'Constitución del Proyecto Fanning - Proyecto Fanning',
  description: 'Qué es y cómo funciona el Proyecto Fanning: sus reglas, la métrica de comprensión, la metodología de conteo y la Realeza.',
};

const SECCIONES: Seccion[] = [
  { id: 'proyecto', titulo: '¿Qué es el proyecto?' },
  { id: 'funcionamiento', titulo: 'Cómo funciona' },
  { id: 'vistazo', titulo: 'Las reglas de un vistazo' },
  { id: 'pilares', titulo: 'I. Inmersión y elegibilidad' },
  { id: 'filtros', titulo: 'II. Filtros e indultos' },
  { id: 'ritmo', titulo: 'III. Ritmo y sesiones' },
  { id: 'comprension', titulo: 'IV. Comprensión' },
  { id: 'metodologia', titulo: 'Metodología' },
  { id: 'realeza', titulo: 'La Realeza' },
  { id: 'etiquetas', titulo: 'Etiquetas del Diccionario' },
  { id: 'glosario', titulo: 'Glosario' },
];

// ---------- Piezas ----------

function enlace(a: Pick<Aparicion, 'titulo' | 'tipo'>): string {
  return `/${a.tipo === 'series' ? 'series' : 'peliculas'}/${encodeURIComponent(a.titulo)}`;
}

const COLORES = {
  purple: { texto: 'text-purple-300', borde: 'border-purple-500/20', fondo: 'bg-purple-500/10', numero: 'bg-purple-500/15 text-purple-300', barra: 'bg-purple-400' },
  red: { texto: 'text-red-300', borde: 'border-red-500/20', fondo: 'bg-red-500/10', numero: 'bg-red-500/15 text-red-300', barra: 'bg-red-400' },
  blue: { texto: 'text-blue-300', borde: 'border-blue-500/20', fondo: 'bg-blue-500/10', numero: 'bg-blue-500/15 text-blue-300', barra: 'bg-blue-400' },
  emerald: { texto: 'text-emerald-300', borde: 'border-emerald-500/20', fondo: 'bg-emerald-500/10', numero: 'bg-emerald-500/15 text-emerald-300', barra: 'bg-emerald-400' },
  amber: { texto: 'text-amber-300', borde: 'border-amber-500/20', fondo: 'bg-amber-500/10', numero: 'bg-amber-500/15 text-amber-300', barra: 'bg-amber-400' },
  gray: { texto: 'text-gray-300', borde: 'border-white/10', fondo: 'bg-white/5', numero: 'bg-white/10 text-gray-300', barra: 'bg-gray-400' },
} as const;
type Color = keyof typeof COLORES;

const idRegla = (numero: number | string) => `regla-${String(numero).toLowerCase()}`;

// Las reglas resumidas en una frase, para leerlas de corrido antes de entrar al detalle.
const RESUMEN: { capitulo: string; color: Color; reglas: [number | string, string][] }[] = [
  { capitulo: 'I. Inmersión y elegibilidad', color: 'purple', reglas: [
    [1, 'Todo en inglés, con subtítulos en inglés.'],
    [2, 'En el cine se aceptan subtítulos en español.'],
    [3, 'Solo eso genera vocabulario oficial.'],
    [4, 'Las sagas y temporadas, en orden.'],
    [5, 'La Realeza va primero.'],
  ] },
  { capitulo: 'II. Filtros e indultos', color: 'red', reglas: [
    [6, 'Fuera el contenido pro-Trump o sionista.'],
    [7, 'La Realeza puede indultar un bloqueo.'],
    [8, 'Algunas figuras están bajo veto.'],
  ] },
  { capitulo: 'III. Ritmo y sesiones', color: 'blue', reglas: [
    [9, 'Una tanda cada 14 a 17 días, con cuota.'],
    [10, 'Gala navideña a fin de año: 550 palabras.'],
    [11, 'Más de 6 horas, en dos sesiones.'],
    [12, 'Pausa de 15 minutos en películas largas.'],
  ] },
  { capitulo: 'IV. Comprensión', color: 'emerald', reglas: [
    ['RE', 'Desde 99,445% se registra 100%.'],
    ['B', 'Bonus por inglés antiguo, francés o alemán.'],
  ] },
];
const TOTAL_REGLAS = RESUMEN.reduce((s, c) => s + c.reglas.length, 0);

// Encabezado común de cada sección: etiqueta, ícono en su recuadro, título e introducción.
function Encabezado({ etiqueta, titulo, icono: Icono, color, intro }: {
  etiqueta?: string; titulo: string; icono: typeof Crown; color: Color; intro?: ReactNode;
}) {
  const c = COLORES[color];
  return (
    <header className="flex items-start gap-4">
      <span className={`shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center ${c.fondo} ${c.borde}`}>
        <Icono className={`w-6 h-6 ${c.texto}`} />
      </span>
      <div className="space-y-1.5 min-w-0">
        {etiqueta && <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${c.texto}`}>{etiqueta}</p>}
        <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{titulo}</h2>
        {intro && <p className="text-gray-400 leading-relaxed max-w-3xl">{intro}</p>}
      </div>
    </header>
  );
}

function Capitulo({ id, numero, titulo, icono, color, intro, children }: {
  id: string; numero: string; titulo: string; icono: typeof Crown; color: Color; intro?: ReactNode; children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 lg:scroll-mt-8 space-y-6 revelar">
      <Encabezado etiqueta={`Capítulo ${numero}`} titulo={titulo} icono={icono} color={color} intro={intro} />
      <div className="space-y-4">{children}</div>
    </section>
  );
}

// Una regla: lo que dice, por qué existe y cómo se ve en las tandas reales.
function Regla({ numero, titulo, color, destacada, porQue, children, practica }: {
  numero: number | string; titulo: string; color: Color; destacada?: boolean; porQue?: ReactNode; children: ReactNode; practica?: ReactNode;
}) {
  const c = COLORES[color];
  return (
    <article id={idRegla(numero)}
      className={`relative overflow-hidden scroll-mt-20 lg:scroll-mt-8 rounded-2xl border p-5 sm:p-6 space-y-4 transition-colors hover:border-white/20 ${destacada ? `${c.fondo} ${c.borde}` : 'bg-white/3 border-white/10'}`}>
      <span aria-hidden className={`absolute left-0 inset-y-0 w-1 ${c.barra} opacity-60`} />
      <div className="flex items-start gap-4">
        <span className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${c.numero}`}>
          {typeof numero === 'number' ? `R${numero}` : numero}
        </span>
        <div className="space-y-2 min-w-0">
          <h3 className="font-semibold text-white text-lg leading-tight flex flex-wrap items-center gap-2">
            {titulo}
            {destacada && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${c.numero}`}>
                <Star className="w-3 h-3" /> Clave
              </span>
            )}
          </h3>
          <div className="text-gray-300 text-[15px] leading-relaxed space-y-2">{children}</div>
        </div>
      </div>
      {(porQue || practica) && (
        <div className="grid gap-3 sm:pl-15">
          {porQue && (
            <div className="flex gap-3 text-sm leading-relaxed bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
              <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-200 mb-0.5">¿Por qué?</p>
                <p className="text-gray-300">{porQue}</p>
              </div>
            </div>
          )}
          {practica && (
            <div className="flex gap-3 text-sm leading-relaxed bg-black/30 border border-white/5 rounded-xl p-4">
              <Clapperboard className={`w-4 h-4 shrink-0 mt-0.5 ${c.texto}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-semibold mb-1.5 ${c.texto}`}>En la práctica</p>
                <div className="text-gray-300 space-y-2">{practica}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Chip({ a, nota }: { a: Aparicion; nota?: string }) {
  return (
    <Link href={enlace(a)} className="inline-flex flex-col px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors">
      <span className="text-white text-xs font-medium">{a.texto}</span>
      <span className="text-[10px] text-gray-500">{nota ?? a.tanda}</span>
    </Link>
  );
}

function Cifra({ valor, texto, icono: Icono }: { valor: string; texto: string; icono: typeof Crown }) {
  return (
    <div className="bg-white/4 border border-white/10 rounded-2xl px-4 py-3 space-y-1">
      <Icono className="w-4 h-4 text-purple-300" />
      <p className="text-xl sm:text-2xl font-bold text-white">{valor}</p>
      <p className="text-[11px] uppercase tracking-wider text-gray-500">{texto}</p>
    </div>
  );
}

// ---------- Página ----------

export default function ReglasPage() {
  // Fecha del build: solo para marcar como "programada" una tanda festiva futura, igual que la línea de tiempo.
  const hoy = new Date().toISOString().slice(0, 10);
  const d = getDatosConstitucion();
  const cumplidas = d.cuotas.tandas.filter(t => t.palabras >= t.cuota).length;
  const maxCuota = Math.max(1, ...d.cuotas.tandas.map(t => Math.max(t.palabras, t.cuota)));
  const maxNivel = Math.max(1, ...d.niveles.map(n => n.cantidad));
  const primera = d.primeraTanda;
  const { vista, repaso, revision } = d.resumen.ingles;
  const horasIngles = Math.round((vista + repaso + revision) / 60);

  return (
    <div id="top" className="min-h-screen text-white px-4 py-6 sm:p-6 md:p-8 selection:bg-purple-500/30">
      {/* Página de lectura: el fondo va más tenue */}
      <FondoAnimado paleta="reglas" fuerza={11} />
      <header className="max-w-6xl mx-auto mb-8 md:mb-12 space-y-6">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
        </Link>
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-linear-to-br from-purple-500/15 via-gray-900/40 to-pink-500/10 p-6 sm:p-10 space-y-5">
          <div aria-hidden className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-purple-500/20 blur-3xl" />
          <div aria-hidden className="absolute -bottom-28 -left-16 w-64 h-64 rounded-full bg-pink-500/10 blur-3xl" />
          <div className="relative flex flex-wrap gap-2 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-200">
              <ListChecks className="w-3.5 h-3.5" /> {TOTAL_REGLAS} reglas en 4 capítulos
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
              <Timer className="w-3.5 h-3.5" /> Unos 10 minutos de lectura
            </span>
          </div>
          <h1 className="relative text-3xl sm:text-4xl md:text-5xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-purple-300 shrink-0" />
            Constitución del Proyecto Fanning
          </h1>
          <p className="relative text-gray-300 text-base sm:text-lg leading-relaxed max-w-3xl">
            Te damos la bienvenida. Aquí están las reglas del juego del sistema de inmersión en inglés
            (régimen B1+): qué se puede ver y cómo, a qué ritmo, cómo se mide lo aprendido y quiénes tienen
            prioridad. Cada regla trae su razón y ejemplos de las tandas reales.
          </p>
          <div className="relative flex flex-wrap gap-3">
            <a href="#vistazo" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-sm font-semibold transition-colors">
              <ListChecks className="w-4 h-4" /> Ver las reglas de un vistazo
            </a>
            <a href="#proyecto" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-sm font-medium transition-colors">
              Empezar desde el principio <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Cifra icono={CalendarDays} valor="15/10/2023" texto="Inicio del proyecto" />
          <Cifra icono={Library} valor={miles(d.resumen.tandas)} texto="Tandas" />
          <Cifra icono={Film} valor={miles(d.resumen.titulos)} texto="Títulos" />
          <Cifra icono={BookText} valor={miles(d.resumen.palabras)} texto="Palabras y frases" />
          <Cifra icono={MessageSquare} valor={miles(d.resumen.lineas)} texto="Líneas de diálogo" />
          <Cifra icono={Clock} valor={`${miles(horasIngles)} h`} texto="Horas de inglés" />
        </div>
      </header>

      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[13rem_1fr] lg:gap-12">
        <aside className="lg:block">
          <IndiceSecciones secciones={SECCIONES} />
        </aside>

        <main className="space-y-16 pt-6 lg:pt-0 min-w-0">
          {/* ---------- Presentación ---------- */}
          <section id="proyecto" className="scroll-mt-20 lg:scroll-mt-8 space-y-6">
            <Encabezado etiqueta="Presentación" titulo="¿Qué es el Proyecto Fanning?" icono={Sparkles} color="purple" />
            <div className="text-gray-300 leading-relaxed space-y-3 max-w-3xl">
              <p>
                Es una forma de aprender inglés viendo películas y series que de verdad dan ganas de ver. Nada de
                diálogos de libro de texto: inglés real, con sus acentos, su jerga y su velocidad, tal como se habla
                en pantalla.
              </p>
              <p>
                Desde el 15 de octubre de 2023, todo se ve en inglés con subtítulos en inglés, y cada palabra o
                frase que no se entiende queda anotada con su traducción. Después se repasa, se cuenta y se mide.
                Así, ver una película también es estudiar, y cada tanda deja un registro de lo que se aprendió.
              </p>
            </div>
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-5 sm:p-6 space-y-2">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-purple-300" /> ¿Por qué «Fanning»?
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Por las hermanas <strong>Dakota y Elle Fanning</strong>, dos de las actrices favoritas del proyecto
                y amores platónicos de <a href="#realeza" className="text-purple-300 underline underline-offset-2">la Realeza</a>.
                El nombre resume la idea de fondo: se aprende mejor con las historias y las personas que uno admira.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icono: Heart, titulo: 'Ver lo que gusta', texto: 'Las ganas de ver algo son el mejor motor. Por eso la Realeza tiene prioridad (Regla 5).' },
                { icono: BookText, titulo: 'Anotar lo que cuesta', texto: 'Lo que no se entiende no se deja pasar: se anota, se traduce y se repasa.' },
                { icono: Sparkles, titulo: 'Medir el avance', texto: 'Las líneas de diálogo y el vocabulario dan la comprensión y el nivel MCER de cada título.' },
              ].map(idea => (
                <div key={idea.titulo} className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-3 transition-colors hover:border-purple-500/30">
                  <span className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
                    <idea.icono className="w-4 h-4 text-purple-300" />
                  </span>
                  <h3 className="font-semibold text-white">{idea.titulo}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{idea.texto}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-400 leading-relaxed max-w-3xl">
              Esta constitución reúne las reglas del juego: qué se puede ver y cómo, a qué ritmo, cómo se mide lo
              aprendido y quiénes tienen prioridad. Cada regla explica su porqué y trae ejemplos de las tandas reales.
            </p>
          </section>

          {/* ---------- Cómo funciona ---------- */}
          <section id="funcionamiento" className="scroll-mt-20 lg:scroll-mt-8 space-y-6">
            <Encabezado etiqueta="En cuatro pasos" titulo="Cómo funciona" icono={Eye} color="purple"
              intro="Cada tanda sigue el mismo recorrido, de la pantalla al registro." />
            <ol className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { icono: Eye, titulo: 'Ver', texto: 'Una película o serie en audio inglés con subtítulos en inglés (Regla 1).' },
                { icono: BookText, titulo: 'Anotar', texto: 'Cada palabra o frase no entendida va a la lista de vocabulario, con su traducción.' },
                { icono: Ruler, titulo: 'Contar', texto: 'Se cuentan las líneas de diálogo de los subtítulos y las entradas del vocabulario.' },
                { icono: Calculator, titulo: 'Medir', texto: 'Con eso se calcula la comprensión y el nivel MCER de cada título y tanda.' },
              ].map((paso, i, pasos) => (
                <li key={paso.titulo} className="relative bg-white/3 border border-white/10 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-200 text-sm font-bold flex items-center justify-center">{i + 1}</span>
                    <paso.icono className="w-5 h-5 text-purple-300" />
                    <h3 className="font-semibold text-white">{paso.titulo}</h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{paso.texto}</p>
                  {i < pasos.length - 1 && (
                    <ChevronRight aria-hidden className="hidden xl:block absolute top-1/2 -right-3 -translate-y-1/2 w-5 h-5 text-purple-400/60 z-10" />
                  )}
                </li>
              ))}
            </ol>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-2">
                <h3 className="font-semibold text-white">Tanda</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  La unidad de estudio: un grupo de películas y episodios que se ven en una fecha y se estudian
                  juntos, con una cuota de palabras (Regla 9). Algunas se dividen en partes (14a°, 14b°), pero
                  siguen siendo una sola tanda.
                </p>
              </div>
              <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-2">
                <h3 className="font-semibold text-white">Ciclo</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Las tandas de un año. Cada ciclo es una fase del proyecto:
                </p>
                <ul className="text-sm space-y-1">
                  {d.ciclos.map(c => (
                    <li key={c.anio} className="flex gap-2">
                      <span className="font-mono text-purple-300">{c.anio}</span>
                      <span className="text-gray-300">{c.nombre}</span>
                      <span className="text-gray-600 ml-auto shrink-0">{miles(c.tandas)} tandas</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ---------- De un vistazo ---------- */}
          <section id="vistazo" className="scroll-mt-20 lg:scroll-mt-8 space-y-6">
            <Encabezado etiqueta="Resumen" titulo="Las reglas de un vistazo" icono={ListChecks} color="purple"
              intro="Cada regla en una frase. Toca cualquiera para ir a su explicación completa." />
            <div className="grid md:grid-cols-2 gap-4">
              {RESUMEN.map(cap => {
                const c = COLORES[cap.color];
                return (
                  <div key={cap.capitulo} className={`rounded-2xl border p-4 sm:p-5 space-y-2 ${c.borde} bg-white/2`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.15em] ${c.texto}`}>{cap.capitulo}</p>
                    <ul className="space-y-1">
                      {cap.reglas.map(([numero, texto]) => (
                        <li key={numero}>
                          <a href={`#${idRegla(numero)}`} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-white/5 transition-colors">
                            <span className={`shrink-0 w-9 h-7 rounded-md flex items-center justify-center text-xs font-bold ${c.numero}`}>
                              {typeof numero === 'number' ? `R${numero}` : numero}
                            </span>
                            <span className="text-sm text-gray-300 group-hover:text-white flex-1">{texto}</span>
                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-300 shrink-0" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ---------- I. Pilares ---------- */}
          <Capitulo id="pilares" numero="I" titulo="Pilares de Inmersión y Elegibilidad" icono={Crown} color="purple"
            intro="Qué cuenta como estudio oficial y en qué orden se ve.">
            <Regla numero={1} titulo="Inmersión Total" color="purple"
              porQue="Escuchar y leer lo mismo al mismo tiempo une el sonido de cada palabra con su escritura. Los subtítulos SDH, HI o CC además describen sonidos e indican quién habla, así que no se pierde ninguna línea.">
              <p>Todo contenido regular se reproduce en <strong>audio inglés + subtítulos en inglés</strong>, preferiblemente en formato SDH, HI o CC.</p>
            </Regla>
            <Regla numero={2} titulo="Cláusula Cine" color="purple"
              porQue="En el cine no se eligen los subtítulos. La excepción permite ver estrenos en pantalla grande sin renunciar al audio en inglés.">
              <p>Se autoriza <strong>audio inglés + subtítulos en español</strong> única y exclusivamente en funciones presenciales en cines de países hispanohablantes.</p>
            </Regla>
            <Regla numero={3} titulo="Elegibilidad de Vocabulario" color="purple"
              porQue="Así todo el vocabulario oficial sale de escuchar inglés real, y las métricas comparan siempre lo mismo.">
              <p>Solo los contenidos vistos bajo la Regla 1 o la Regla 2 generan vocabulario oficial.</p>
            </Regla>
            <Regla numero={4} titulo="Orden Canónico" color="purple"
              porQue="Las historias se entienden mejor en orden, y el vocabulario de una entrega prepara para la siguiente."
              practica={d.sagas.length > 0 && d.sagas.map(s => (
                <div key={s.nombre} className="space-y-1.5">
                  <p className="text-xs text-gray-500">{s.nombre}</p>
                  <div className="flex flex-wrap gap-2">{s.entregas.map(a => <Chip key={a.titulo} a={a} />)}</div>
                </div>
              ))}>
              <p>Se respeta el orden de las sagas y el orden cronológico de las temporadas, salvo conflicto directo con la <em>Prioridad de Realeza</em>.</p>
            </Regla>
            <Regla numero={5} titulo="Prioridad de Realeza" color="purple" destacada
              porQue="La realeza es el motor del proyecto: lo que más se quiere ver es lo que más se disfruta estudiar."
              practica={<p>Los miembros de la Realeza están en <a href="#realeza" className="text-purple-300 underline underline-offset-2">su propia sección</a>.</p>}>
              <p>El contenido con miembros de la <strong>Realeza</strong> (Reyes Supremos, Reyes, Reinas y Amores Platónicos) tiene preferencia absoluta sobre cualquier otra planificación o saga activa.</p>
            </Regla>
          </Capitulo>

          {/* ---------- II. Filtros ---------- */}
          <Capitulo id="filtros" numero="II" titulo="Filtros Éticos e Indultos Reales" icono={ShieldAlert} color="red"
            intro="Qué queda fuera del proyecto y cuándo la Realeza lo permite igual.">
            <Regla numero={6} titulo="Filtro Político-Ético" color="red">
              <p>Queda bloqueado el contenido que promueva posturas pro-Trump o el sionismo, o de personas en conflicto con alguna reina o rey.</p>
            </Regla>
            <Regla numero={7} titulo="Cláusula de Indulto Real" color="red" destacada
              porQue="El beneficio académico de ver a un miembro de la Realeza pesa más que el bloqueo."
              practica={d.indultos.length > 0 && (
                <div className="flex flex-wrap gap-2">{d.indultos.map(a => <Chip key={a.titulo} a={a} nota={`Indultada · ${a.tanda}`} />)}</div>
              )}>
              <p>El bloqueo de la Regla 6 queda sin efecto si en la producción participa activamente un miembro de la Realeza.</p>
              <p className="text-gray-400">Caso Sydney Sweeney: hacen falta al menos <strong>dos reinas o reyes</strong>, o <strong>un Amor Platónico o Rey Supremo</strong>.</p>
            </Regla>
            <Regla numero={8} titulo="Restricciones de Elenco (Veto)" color="red">
              <p>Se restringen los contenidos protagonizados mayoritariamente por figuras bajo veto estricto (ej. Sydney Sweeney).</p>
              <p className="text-gray-400">Excepciones: obras corales amplias de alta relevancia para la Realeza, como <em>Euphoria</em>, o apariciones puntuales, como en <em>Once Upon a Time in Hollywood</em>.</p>
            </Regla>
          </Capitulo>

          {/* ---------- III. Ritmo ---------- */}
          <Capitulo id="ritmo" numero="III" titulo="Métricas, Ritmo y Sesiones" icono={Clock} color="blue"
            intro="Cada cuánto hay tanda, cuántas palabras se esperan y cómo se reparte el tiempo.">
            <Regla numero={9} titulo="Ritmo y Cuotas Estacionales" color="blue"
              practica={d.cuotas.tandas.length > 0 && (
                <>
                  <p>
                    En el ciclo {d.cuotas.ciclo}, <strong className="text-white">{cumplidas} de {d.cuotas.tandas.length}</strong> tandas regulares alcanzaron su cuota.
                  </p>
                  <div className="flex items-end gap-1 h-28 pt-2" role="img" aria-label={`Palabras por tanda del ciclo ${d.cuotas.ciclo} comparadas con su cuota`}>
                    {d.cuotas.tandas.map(t => (
                      <div key={t.title} className="relative flex-1 h-full flex items-end" title={`${t.title}: ${miles(t.palabras)} palabras (cuota ${t.cuota})`}>
                        <div className={`w-full rounded-t ${t.palabras >= t.cuota ? 'bg-blue-400/70' : 'bg-gray-600'}`} style={{ height: `${(t.palabras / maxCuota) * 100}%` }} />
                        <div className="absolute inset-x-0 border-t border-dashed border-amber-300/80" style={{ bottom: `${(t.cuota / maxCuota) * 100}%` }} />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Cada barra es una tanda; la línea punteada es su cuota. En gris, las que quedaron bajo la cuota.</p>
                </>
              )}>
              <p>Las tandas se hacen cada <strong>14 a 17 días</strong>. Desde el ciclo 2027 y hasta el 2031:</p>
              <ul className="list-disc list-inside text-gray-400 space-y-1">
                <li><strong className="text-gray-200">Todas las tandas regulares:</strong> máximo de 450 palabras/frases.</li>
                <li><strong className="text-gray-200">Tanda de Fin de Año:</strong> máximo de 550 palabras/frases (Regla 10).</li>
              </ul>
              <p className="text-sm text-gray-500">Hasta el ciclo 2026, la cuota dependía de la época del año: 400 palabras de enero a junio y de octubre a diciembre, y 500 de julio a septiembre.</p>
            </Regla>
            <Regla numero={10} titulo="Tanda de Gala (Cierre de Año)" color="blue" destacada
              practica={d.festivas.length > 0 && (
                <ul className="space-y-1.5">
                  {d.festivas.map(t => (
                    <li key={t.id} className="flex gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                      <span>
                        <span className="text-white font-medium">{t.title}</span>{' '}
                        <span className="text-gray-500">· {t.date}{t.fecha > hoy ? ' (programada)' : ''}</span>
                        <span className="block text-gray-400">{t.items.map(i => i.texto).join(', ')}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}>
              <ul className="list-disc list-inside text-gray-400 space-y-1">
                <li>Se realiza entre el <strong className="text-gray-200">25 y el 31 de diciembre</strong>.</li>
                <li>Debe incluir contenido de temática navideña.</li>
                <li>Cuota fija de <strong className="text-gray-200">550 palabras</strong>.</li>
              </ul>
            </Regla>
            <Regla numero={11} titulo="Regla de las 6 Horas" color="blue"
              porQue="Más de seis horas seguidas cansan y la atención baja; repartirlas en dos días mantiene la calidad del estudio."
              practica={d.dosSesiones.masLarga && (
                <p>
                  <strong className="text-white">{d.dosSesiones.cantidad} de {d.dosSesiones.total}</strong> tandas van en dos sesiones.
                  La más larga fue la {d.dosSesiones.masLarga.title} ({d.dosSesiones.masLarga.date}), con {duracion(d.dosSesiones.masLarga.duracion)}.
                </p>
              )}>
              <p>Si los contenidos de una tanda suman más de 6 horas, se divide en dos sesiones seguidas: el <strong>Día n-1</strong> (víspera) y el <strong>Día n</strong> (fecha original).</p>
              <p className="text-sm text-gray-400">Hasta la 68° Tanda (17/10/2026) el límite era de 5 horas; las tandas anteriores se cuentan como se hicieron.</p>
            </Regla>
            <Regla numero={12} titulo="Pausa Activa" color="blue"
              porQue="Proteger la vista y mantener el foco en los largometrajes extensos."
              practica={d.largas.masLarga && (
                <p>
                  <strong className="text-white">{d.largas.cantidad}</strong> películas del proyecto duran más de 2 horas.
                  La más larga es <em>{d.largas.masLarga.title}</em>, con {duracion(d.largas.masLarga.duracion)}.
                </p>
              )}>
              <p>Los contenidos de <strong>más de 2 horas</strong> dan derecho a un receso de <strong>15 minutos</strong>.</p>
              <p className="text-gray-400">Opcional: se puede ajustar según lo exigente del contenido (más de 2 horas y media permiten 20 a 25 minutos).</p>
            </Regla>
          </Capitulo>

          {/* ---------- IV. Comprensión ---------- */}
          <Capitulo id="comprension" numero="IV" titulo="Métrica de Comprensión" icono={Calculator} color="emerald"
            intro={<>El éxito de cada tanda se mide con un criterio estricto: <strong className="text-gray-200">una sola palabra desconocida invalida la línea de diálogo completa</strong>.</>}>
            <article className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 sm:p-6 space-y-5">
              <div className="bg-black/50 border border-emerald-500/30 p-4 sm:p-6 rounded-xl text-center font-mono text-emerald-300 text-sm sm:text-base">
                % Comprensión = (Líneas totales − Líneas no entendidas) ÷ Líneas totales × 100
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Cada palabra o frase del vocabulario cuenta como <strong>una línea no entendida</strong>.
                {primera && (
                  <> Por ejemplo, la {primera.title} ({primera.textos.join(', ')}) tuvo {miles(primera.lineas)} líneas
                  y {miles(primera.palabras)} palabras: ({miles(primera.lineas)} − {miles(primera.palabras)}) ÷ {miles(primera.lineas)} = <strong className="text-emerald-300">{porcentaje(primera.comprension)}</strong>.</>
                )}
                {d.mejorTanda && (
                  <> La mejor comprensión es la de la {d.mejorTanda.title}: <strong className="text-emerald-300">{porcentaje(d.mejorTanda.comprension)}</strong>.</>
                )}
              </p>
              {primera && <CalculadoraComprension lineasIniciales={primera.lineas} palabrasIniciales={primera.palabras} />}
            </article>
            <Regla numero="RE" titulo="Regla del Redondeo Estratégico" color="emerald">
              <p>Si la comprensión llega a <strong>99,445% o más</strong>, se registra como <strong>100%</strong> en los informes oficiales. Puedes probarlo en la calculadora.</p>
            </Regla>
            <Regla numero="B" titulo="Sistema de Bonus Especial" color="emerald">
              <p>Estudiar bien términos de <strong>inglés antiguo o moderno, francés o alemán</strong> que aparezcan en lo visto suma un bonus en la evaluación de la tanda.</p>
            </Regla>
          </Capitulo>

          {/* ---------- Metodología ---------- */}
          <section id="metodologia" className="scroll-mt-20 lg:scroll-mt-8 space-y-5">
            <Encabezado etiqueta="Cómo se cuenta" titulo="Metodología" icono={ScrollText} color="gray"
              intro={<>Cómo se cuentan las líneas y las palabras y cómo se calcula el nivel. El detalle completo está en la carpeta <code className="text-gray-300">Metodología/</code> del proyecto.</>} />

            <div className="grid xl:grid-cols-2 gap-4">
              <article className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold text-white">Líneas de diálogo</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Una línea es <strong className="text-gray-200">un subtítulo</strong>, aunque ocupe dos renglones. Cuenta si tiene al menos una letra o un número; las acotaciones de sonido también cuentan.
                </p>
                <ul className="font-mono text-xs space-y-1.5 bg-black/40 rounded-xl p-4">
                  {[
                    ['I told you we were late.', true],
                    ['[heavy breathing]', true],
                    ['3... 2... 1...', true],
                    ['♪ Somewhere far away ♪', true],
                    ['♪♪', false],
                    ['...', false],
                    ['Subtitles by opensubtitles', false],
                  ].map(([texto, cuenta]) => (
                    <li key={String(texto)} className="flex items-center gap-2">
                      {cuenta ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <X className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                      <span className={cuenta ? 'text-gray-200' : 'text-gray-500 line-through'}>{texto}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold text-white">Palabras y frases</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Cada entrada del vocabulario vale <strong className="text-gray-200">1</strong>, sea una palabra o una frase larga. Una repetida con el mismo sentido cuenta una sola vez; con otro sentido, cuenta de nuevo.
                </p>
                <ul className="font-mono text-xs space-y-1.5 bg-black/40 rounded-xl p-4">
                  {[
                    ['Plaster: yeso', '+1'],
                    ['Can I crash here? (no literal): ¿Puedo pasar la noche aquí?', '+1'],
                    ['play (verbo): jugar', '+1'],
                    ['play (verbo): jugar', '+0'],
                    ['play (sustantivo): obra', '+1'],
                  ].map(([texto, suma], i) => (
                    <li key={i} className="flex gap-2">
                      <span className={`shrink-0 w-6 ${suma === '+1' ? 'text-emerald-400' : 'text-gray-600'}`}>{suma}</span>
                      <span className={suma === '+1' ? 'text-gray-200' : 'text-gray-500'}>{texto}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <article className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-white">Horas de inglés</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                No es solo lo que dura lo visto: cada tanda suma tres momentos de contacto con el inglés.
              </p>
              <ol className="grid sm:grid-cols-3 gap-3 text-sm">
                {[
                  { titulo: 'Primera vista', minutos: vista, texto: 'Ver el contenido por primera vez: su duración.' },
                  { titulo: 'Repaso diario', minutos: repaso, texto: 'Leer el vocabulario de la tanda en voz alta una vez al día, a velocidad normal y con buena dicción (140 palabras por minuto, palabra y traducción), hasta la siguiente tanda.' },
                  { titulo: 'Segunda vista', minutos: revision, texto: 'Volver a ver el contenido después de estudiar el vocabulario: su duración otra vez.' },
                ].map(m => (
                  <li key={m.titulo} className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-1">
                    <p className="text-white font-medium">{m.titulo}</p>
                    <p className="text-2xl font-bold text-purple-300">{miles(Math.round(m.minutos / 60))} h</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{m.texto}</p>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-gray-500">
                Total: <strong className="text-gray-300">{miles(horasIngles)} h</strong>. La última tanda, que aún no tiene siguiente, repasa hasta la separación típica entre tandas.
              </p>
            </article>

            <article className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-5">
              <h3 className="font-semibold text-white">Nivel de inglés (MCER)</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Cada título recibe un nivel de A1 a C2, calculado con tres señales. El vocabulario pesa más porque es lo que realmente costó entender.
              </p>
              <div className="space-y-2">
                <div className="flex h-9 rounded-lg overflow-hidden text-xs font-medium">
                  <div className="bg-purple-500/70 flex items-center px-3" style={{ width: '60%' }}>Vocabulario 60%</div>
                  <div className="bg-blue-500/70 flex items-center px-3" style={{ width: '25%' }}>Diálogos 25%</div>
                  <div className="bg-emerald-500/70 flex items-center justify-center" style={{ width: '15%' }}>15%</div>
                </div>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li><span className="text-purple-300">Vocabulario:</span> qué tan difíciles son las palabras no entendidas y cuántas hay por línea.</li>
                  <li><span className="text-blue-300">Diálogos:</span> qué nivel hace falta para conocer el 95% de las palabras dichas, y qué tan rápido se habla.</li>
                  <li><span className="text-emerald-300">Temas:</span> si hay vocabulario de un área especializada (legal, médica, militar, de época, ajedrez, aeronáutica…).</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-wider text-gray-500">Títulos del proyecto por nivel</p>
                <div className="grid grid-cols-6 gap-2 items-end h-32">
                  {d.niveles.map(n => (
                    <div key={n.nivel} className="flex flex-col items-center justify-end h-full gap-1">
                      <span className="text-xs text-gray-400">{n.cantidad}</span>
                      <div className="w-full rounded-t bg-linear-to-t from-purple-600/60 to-purple-400/80" style={{ height: `${(n.cantidad / maxNivel) * 70}%`, minHeight: n.cantidad ? 4 : 0 }} />
                      <span className="text-xs font-mono text-gray-300">{n.nivel}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Los niveles intermedios (por ejemplo B1-B2) se cuentan en el de abajo.</p>
              </div>
            </article>
          </section>

          {/* ---------- Realeza ---------- */}
          <section id="realeza" className="scroll-mt-20 lg:scroll-mt-8 space-y-5">
            <Encabezado etiqueta="Quiénes tienen prioridad" titulo="La Realeza" icono={Crown} color="amber"
              intro={<>Los artistas con Prioridad de Realeza (Regla 5) y poder de Indulto Real (Regla 7).
                Sus fotos, sus títulos y lo que enseñó cada uno están en{' '}
                <Link href="/realeza" className="text-amber-300 underline underline-offset-2">el Salón del Trono</Link>.</>} />
            <div className="grid md:grid-cols-2 gap-4">
              {agrupar(getRealeza()).map(g => {
                const superior = g.id === 'supremos' || g.id === 'platonicos';
                const Icono = g.id === 'platonicos' ? Heart : Crown;
                return (
                  <article key={g.id}
                    className={`rounded-2xl border p-5 space-y-3 ${superior ? 'bg-amber-500/5 border-amber-500/25' : 'bg-white/3 border-white/10'}`}>
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Icono className={`w-5 h-5 ${g.id === 'platonicos' ? 'text-pink-400' : 'text-amber-300'}`} />
                      {g.nombre}
                      <span className="text-xs text-gray-500 font-normal">({g.miembros.length})</span>
                    </h3>
                    {g.descripcion && <p className="text-xs text-gray-500">{g.descripcion}</p>}
                    <ul className="flex flex-wrap gap-2">
                      {g.miembros.map(m => (
                        <li key={m.nombre} className={`px-3 py-1 rounded-full text-sm border ${superior ? 'border-amber-500/30 text-amber-100' : 'border-white/10 text-gray-300'}`}>{m.nombre}</li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </section>

          {/* ---------- Etiquetas del Diccionario ---------- */}
          <section id="etiquetas" className="scroll-mt-20 lg:scroll-mt-8 space-y-5">
            <Encabezado etiqueta="Diccionario Fanning" titulo="Etiquetas del Diccionario" icono={Tags} color="emerald"
              intro={<>La nota entre paréntesis de cada palabra anotada («Rely (verbo)», «Can I crash here? (pregunta no literal)»)
                se convierte en etiquetas. Una palabra puede tener varias; cada una lleva al <Link href="/diccionario" className="text-emerald-300 hover:underline">Diccionario</Link> con ese filtro.</>} />
            <GlosarioEtiquetas />
          </section>

          {/* ---------- Glosario ---------- */}
          <section id="glosario" className="scroll-mt-20 lg:scroll-mt-8 space-y-5 pb-16">
            <Encabezado etiqueta="Palabras del proyecto" titulo="Glosario" icono={CircleHelp} color="gray"
              intro="¿Alguna palabra no quedó clara? Aquí está, en pocas palabras." />
            <dl className="grid sm:grid-cols-2 gap-3">
              {[
                ['Tanda', 'Grupo de títulos que se ven en una fecha y se estudian juntos.'],
                ['Parte', 'Una tanda dividida en varias fechas (14a°, 14b°). Las partes forman una sola tanda.'],
                ['Horas de inglés', 'Primera vista + repaso diario del vocabulario + segunda vista (ver Metodología).'],
                ['Ciclo', 'Las tandas de un año; cada uno es una fase del proyecto.'],
                ['Cuota', 'Palabras y frases que se esperan en una tanda (Reglas 9 y 10).'],
                ['Tanda de Gala', 'La tanda navideña del cierre de año, con cuota de 550 (Regla 10).'],
                ['Dos sesiones', 'Tanda de más de 6 horas (5 horas hasta la 68° Tanda), repartida en Día n-1 y Día n (Regla 11).'],
                ['Indulto Real', 'Permiso para ver un contenido bloqueado gracias a la Realeza (Regla 7).'],
                ['Veto', 'Restricción a figuras específicas del elenco (Regla 8).'],
                ['SDH / HI / CC', 'Subtítulos para personas sordas: además del diálogo, describen sonidos e indican quién habla.'],
                ['MCER', 'Marco Común Europeo de Referencia: los niveles A1, A2, B1, B2, C1 y C2.'],
                ['Comprensión', 'Porcentaje de líneas de diálogo entendidas por completo (Capítulo IV).'],
                ['Ficha', 'El archivo de cada título en contenido/titulos/, con sus datos y sus PDFs.'],
                ['Acotación', 'Descripción de un sonido o acción en los subtítulos, como [door slams].'],
              ].map(([termino, def]) => (
                <div key={termino} className="bg-white/3 border border-white/10 rounded-xl px-4 py-3 space-y-0.5">
                  <dt className="font-semibold text-white text-sm">{termino}</dt>
                  <dd className="text-sm text-gray-400 leading-relaxed">{def}</dd>
                </div>
              ))}
            </dl>
            <div className="flex justify-center pt-6">
              <a href="#top" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium transition-colors">
                <ArrowUp className="w-4 h-4" /> Volver arriba
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
