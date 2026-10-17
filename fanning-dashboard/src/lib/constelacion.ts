// La Constelación de la Realeza: cada artista es una estrella y cada título que comparten
// dos de ellos, un hilo entre ambos. La posición de cada estrella se calcula en el build con
// un acomodo por fuerzas (Fruchterman–Reingold): los hilos atraen, las estrellas se repelen.
// No usa nada al azar, así el mapa sale igual en cada build.
import type { MovieStats } from '@/types/manifest';
import type { Artista } from '@/lib/realeza';

export const ANCHO = 1000;
export const ALTO = 720;

export type Estrella = Pick<Artista, 'nombre' | 'foto' | 'tipo' | 'rango'> & {
  titulos: number;
  palabras: number;
  x: number;
  y: number;
  r: number;
};

export interface Hilo {
  a: string;
  b: string;
  titulos: string[];
}

export function hilos(todos: MovieStats[], nombres: Set<string>): Hilo[] {
  const pares = new Map<string, Hilo>();
  for (const m of todos) {
    const ns = Object.keys(m.realeza ?? {}).filter(n => nombres.has(n)).sort();
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const clave = `${ns[i]}|${ns[j]}`;
        const h = pares.get(clave) ?? { a: ns[i], b: ns[j], titulos: [] };
        h.titulos.push(m.title);
        pares.set(clave, h);
      }
    }
  }
  return [...pares.values()];
}

export function acomodar(artistas: Omit<Estrella, 'x' | 'y' | 'r'>[], enlaces: Hilo[]): Estrella[] {
  const n = artistas.length;
  // Tamaño por cantidad de títulos (raíz, para que Margot no tape a todos).
  const maxT = Math.max(...artistas.map(a => a.titulos), 1);
  const radio = (t: number) => 16 + 22 * Math.sqrt(t / maxT);

  // Comienzo: espiral de ángulo dorado, los de más títulos al centro.
  const orden = [...artistas].sort((a, b) => b.titulos - a.titulos || a.nombre.localeCompare(b.nombre));
  const pos = new Map(orden.map((a, i) => {
    const ang = i * 2.39996;
    const d = 40 + 300 * Math.sqrt(i / n);
    return [a.nombre, { x: ANCHO / 2 + d * Math.cos(ang), y: ALTO / 2 + d * Math.sin(ang) }];
  }));

  const k = Math.sqrt((ANCHO * ALTO) / n) * 0.7;
  let temperatura = 80;
  for (let iter = 0; iter < 700; iter++) {
    const mov = new Map(orden.map(a => [a.nombre, { x: 0, y: 0 }]));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const p = pos.get(orden[i].nombre)!, q = pos.get(orden[j].nombre)!;
        const dx = p.x - q.x, dy = p.y - q.y;
        const d = Math.max(Math.hypot(dx, dy), 1);
        const f = (k * k) / d;
        const mi = mov.get(orden[i].nombre)!, mj = mov.get(orden[j].nombre)!;
        mi.x += (dx / d) * f; mi.y += (dy / d) * f;
        mj.x -= (dx / d) * f; mj.y -= (dy / d) * f;
      }
    }
    for (const h of enlaces) {
      const p = pos.get(h.a), q = pos.get(h.b);
      if (!p || !q) continue;
      const dx = p.x - q.x, dy = p.y - q.y;
      const d = Math.max(Math.hypot(dx, dy), 1);
      const f = ((d * d) / k) * (1 + Math.log(h.titulos.length));
      const ma = mov.get(h.a)!, mb = mov.get(h.b)!;
      ma.x -= (dx / d) * f; ma.y -= (dy / d) * f;
      mb.x += (dx / d) * f; mb.y += (dy / d) * f;
    }
    for (const a of orden) {
      const p = pos.get(a.nombre)!, m = mov.get(a.nombre)!;
      // Gravedad hacia el centro, para que las estrellas sueltas no se vayan del mapa.
      m.x += (ANCHO / 2 - p.x) * 0.45;
      m.y += (ALTO / 2 - p.y) * 1.1;
      const d = Math.max(Math.hypot(m.x, m.y), 1);
      p.x += (m.x / d) * Math.min(d, temperatura);
      p.y += (m.y / d) * Math.min(d, temperatura);
    }
    temperatura = Math.max(1, temperatura * 0.993);
  }

  // Al final, que ninguna estrella ni su nombre (que va debajo) pise a otra, y que todas quepan.
  // Cada estrella ocupa una caja: el ancho del círculo o del nombre, y el alto del círculo más el nombre.
  const estrellas: Estrella[] = orden.map(a => ({ ...a, ...pos.get(a.nombre)!, r: radio(a.titulos) }));
  const caja = (e: Estrella) => ({ w: Math.max(2 * e.r, e.nombre.length * 7) + 14, arriba: e.r + 8, abajo: e.r + 24 });
  for (let pasada = 0; pasada < 400; pasada++) {
    let movio = false;
    for (let i = 0; i < estrellas.length; i++) {
      for (let j = i + 1; j < estrellas.length; j++) {
        const p = estrellas[i], q = estrellas[j];
        const cp = caja(p), cq = caja(q);
        const solapeX = (cp.w + cq.w) / 2 - Math.abs(q.x - p.x);
        const solapeY = q.y >= p.y ? (cp.abajo + cq.arriba) - (q.y - p.y) : (cq.abajo + cp.arriba) - (p.y - q.y);
        if (solapeX <= 0 || solapeY <= 0) continue;
        // Se separan por el lado que menos cuesta.
        if (solapeX < solapeY) {
          const s = (q.x >= p.x ? 1 : -1) * (solapeX / 2 + 0.5);
          p.x -= s; q.x += s;
        } else {
          const s = (q.y >= p.y ? 1 : -1) * (solapeY / 2 + 0.5);
          p.y -= s; q.y += s;
        }
        movio = true;
      }
    }
    for (const e of estrellas) {
      const c = caja(e);
      e.x = Math.min(ANCHO - c.w / 2 - 8, Math.max(c.w / 2 + 8, e.x));
      e.y = Math.min(ALTO - c.abajo - 8, Math.max(c.arriba + 8, e.y));
    }
    if (!movio) break;
  }
  return estrellas.map(e => ({ ...e, x: Math.round(e.x * 10) / 10, y: Math.round(e.y * 10) / 10, r: Math.round(e.r * 10) / 10 }));
}
