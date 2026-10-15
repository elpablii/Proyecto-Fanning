# Dashboard del Proyecto Fanning

La página web del proyecto (Next.js + React + TypeScript).

## Usarla en tu computador

```
npm install
npm run dev
```

Se abre en http://localhost:3000.

## Publicar

```
npm run build
```

Vercel la publica sola al subir los cambios a `main`.

## De dónde salen los datos

Todo lo que muestra la página está en `data/` y lo genera `python fanning.py actualizar` desde la raíz del repositorio, a partir de las fichas de `contenido/` y los PDFs. **No se edita a mano**: el próximo `actualizar` lo vuelve a escribir.

Para agregar o quitar películas y series, ver el `README.md` de la raíz.

## Estructura

| Archivo | Qué es |
|---|---|
| `src/app/page.tsx` | Portada (métricas, ranking, catálogo y buscador) |
| `src/app/peliculas/[slug]/` | Página de cada película |
| `src/app/series/[slug]/` | Página de cada serie |
| `src/app/timeline/` | Línea de tiempo de tandas |
| `src/app/reglas/` | Reglas del proyecto |
| `src/components/` | Componentes de cada página y `ui/` (tarjetas, flashcards, buscador) |
| `src/lib/formato.ts` | Formato de números (punto de miles) |
| `src/types/manifest.ts` | Tipos de los datos de `data/manifest.json` |
