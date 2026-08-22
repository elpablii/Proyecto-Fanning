// Aquí puedes editar fácil y manualmente los vocabularios de las películas/series.
// Usa este archivo para corregir faltas de ortografía, traducciones incorrectas, o eliminar palabras que no desees.
// Solo necesitas añadir el título exacto de la película (tal como aparece en la app).
// Luego, añade la palabra original (exacta) que quieres modificar, y especifica qué cambiar.

export type VocabOverride = {
  // Escribe aquí la palabra corregida si quieres cambiar el inglés
  word?: string;
  // Escribe aquí la traducción corregida si quieres cambiar el español
  translation?: string;
  // Pon esto en true si quieres eliminar la palabra por completo de la lista
  remove?: boolean;
};

export const vocabularyOverrides: Record<string, Record<string, VocabOverride>> = {
  // Ejemplo:
  // "Teen Spirit": {
  //   "Bleat (verbo)": { translation: "balar suavemente" }, // Cambiar traducción
  //   "Engine idles (acotación)": { word: "Engine idles", translation: "motor al ralentí" }, // Cambiar ambas
  //   "Scrap (verbo)": { remove: true } // Eliminar palabra
  // },
};
