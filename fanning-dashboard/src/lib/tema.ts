// El tema de la página (ver components/ui/TemaSelector.tsx y el modo claro en globals.css).
export type Tema = 'oscuro' | 'claro' | 'sistema';
export const CLAVE_TEMA = 'tema';

// Va en el <head> (ver app/layout.tsx) y pone data-tema en <html> antes de pintar, para que la
// página no parpadee. Sin JavaScript, o si falla, queda el oscuro.
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem('${CLAVE_TEMA}');var c=t==='claro'||(t==='sistema'&&matchMedia('(prefers-color-scheme: light)').matches);document.documentElement.dataset.tema=c?'claro':'oscuro'}catch(e){}})()`;
