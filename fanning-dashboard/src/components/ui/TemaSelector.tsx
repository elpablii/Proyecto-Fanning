"use client";

import { useSyncExternalStore } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { CLAVE_TEMA as CLAVE, type Tema } from '@/lib/tema';

// El tema elegido se guarda en el navegador: "oscuro" (el de siempre), "claro" o "sistema" (sigue
// al sistema operativo). Se aplica con data-tema en <html>; SCRIPT_TEMA (lib/tema.ts) lo pone antes
// de pintar la página para que no parpadee.

const ORDEN: Tema[] = ['oscuro', 'claro', 'sistema'];
const TEXTO: Record<Tema, string> = { oscuro: 'Modo oscuro', claro: 'Modo claro', sistema: 'Como el sistema' };
const ICONO = { oscuro: Moon, claro: Sun, sistema: Monitor };

function leer(): Tema {
  try {
    const t = localStorage.getItem(CLAVE);
    return t === 'claro' || t === 'sistema' ? t : 'oscuro';
  } catch {
    return 'oscuro';
  }
}

function aplicar(tema: Tema) {
  const claro = tema === 'claro' || (tema === 'sistema' && window.matchMedia('(prefers-color-scheme: light)').matches);
  document.documentElement.dataset.tema = claro ? 'claro' : 'oscuro';
}

const avisos = new Set<() => void>();
function suscribir(aviso: () => void) {
  avisos.add(aviso);
  // En "sistema", si cambia el del sistema operativo, la página lo sigue.
  const consulta = window.matchMedia('(prefers-color-scheme: light)');
  const alCambiar = () => { if (leer() === 'sistema') aplicar('sistema'); };
  consulta.addEventListener('change', alCambiar);
  return () => { avisos.delete(aviso); consulta.removeEventListener('change', alCambiar); };
}

export default function TemaSelector() {
  const tema = useSyncExternalStore(suscribir, leer, () => 'oscuro' as Tema);
  const siguiente = ORDEN[(ORDEN.indexOf(tema) + 1) % ORDEN.length];
  const Icono = ICONO[tema];

  const cambiar = () => {
    try { localStorage.setItem(CLAVE, siguiente); } catch { /* sin almacenamiento: solo por esta visita */ }
    aplicar(siguiente);
    avisos.forEach(a => a());
  };

  return (
    <button onClick={cambiar} title={`${TEXTO[tema]} · cambiar a: ${TEXTO[siguiente].toLowerCase()}`}
      aria-label={`${TEXTO[tema]}. Cambiar a ${TEXTO[siguiente].toLowerCase()}`}
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-white/15 bg-gray-900/80 backdrop-blur-md px-3 py-2 text-sm text-gray-200 shadow-lg hover:bg-gray-800 transition print:hidden">
      <Icono size={16} aria-hidden />
      <span className="hidden sm:inline">{TEXTO[tema]}</span>
    </button>
  );
}
