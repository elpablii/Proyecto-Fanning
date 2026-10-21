# Plan de ciberseguridad de la página

La página es un sitio Next.js en Vercel sin usuarios, formularios ni base de datos: todo se genera
estático en el build. Los riesgos reales están en las dependencias, el repositorio y las cuentas.

## 🔴 Urgente

1. **Clave antigua de TMDB en el historial público de git.** Estuvo escrita en los scripts de Python;
   ya no está en el código, pero sigue en commits viejos. Revocarla en TMDB (Ajustes → API). No hace
   falta reescribir el historial. La clave actual (`.env.local`) es otra.
2. **Vulnerabilidades en dependencias** (`npm audit`: 1 crítica en `next`, 4 altas en `postcss`,
   `sharp`, `nanoid`, `source-map-js`, 1 moderada). Actualizar `next`/`eslint-config-next` y correr
   `npm audit fix`.

## 🟠 Fase 1 — Cuentas y repositorio

| Medida | Dónde |
|---|---|
| 2FA con app o llave física (no SMS) | GitHub, Vercel, TMDB, correo |
| Proteger `main`: CI obligatorio, sin force-push | GitHub → Settings → Branches |
| *Secret scanning* + *Push protection* | GitHub → Settings → Code security |
| Revisar accesos y tokens de Vercel | Vercel → Settings |

## 🟡 Fase 2 — Dependencias y CI

- `.github/dependabot.yml` semanal para `npm`, `pip` y `github-actions`.
- Paso `npm audit --omit=dev --audit-level=high` en `ci.yml`.
- `permissions: contents: read` en el workflow.
- Fijar las Actions por hash de commit en vez de `@v4`/`@v5`.
- Borrar `NEXT_PUBLIC_TMDB_API_KEY` (el prefijo la mete en el JavaScript público; la página no la usa)
  o renombrarla a `TMDB_API_KEY`, en `.env.local` y en Vercel.

## 🟢 Fase 3 — Cabeceras HTTP (`headers()` en `next.config.ts`)

- `Content-Security-Policy`: propio dominio + `image.tmdb.org`; el script del tema de `layout.tsx`
  se permite por su hash sha256.
- `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (sin cámara, micrófono ni
  ubicación), `frame-ancestors 'none'`.
- Verificar en securityheaders.com y Mozilla Observatory (meta: A).

## 🔵 Fase 4 — Mantenimiento

- Mensual: PRs de Dependabot y `npm audit`.
- Trimestral: accesos y tokens de GitHub/Vercel; volver a pasar los escáneres de cabeceras.
- Ante una filtración: revocar primero, investigar después.
- Copia de respaldo fuera de GitHub (clon en disco externo).

## Lo que no hace falta

Sin formularios, login, base de datos ni rutas dinámicas (todas `force-static`): no aplican WAF,
límites de peticiones ni defensas contra SQL injection o CSRF. Revisar este plan si eso cambia.
