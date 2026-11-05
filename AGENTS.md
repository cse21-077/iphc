# AGENTS.md — IPHC MMUSO

Guidance for AI agents and developers working in this repository. Read this before restructuring anything.

## Architecture

- **Frontend**: React 19 + Vite + Tailwind CSS 4 + vite-plugin-pwa. Code in `src/`. Mobile-first single-column app (`max-w-md`) with an admin dashboard at `#/admin` (`src/components/admin/`).
- **API**: one Express app in `server/index.ts` (all routes, auth, Prisma queries). `server/vercel-handler.ts` adapts it for Vercel; `server/security.ts` has password/session helpers.
- **Database**: PostgreSQL via Prisma (`prisma/schema.prisma`), hosted on Supabase. Auth identities are phone-based in Supabase Auth; app accounts live in `app_users`/`members`/`user_roles`.
- **Email**: password-reset emails go through Resend (`RESEND_API_KEY` env var). The sender is hardcoded to `MMUSO <noreply@iphc-silo.com>` — that domain must stay verified in the same Resend account that owns the API key, and there is no `RESEND_FROM_EMAIL` override.

## Vercel deployment rules (DO NOT BREAK)

1. **Never delete the per-route stubs in `api/`.** Each file (`api/auth/me.ts`, `api/auth/login.ts`, `api/auth/forgot-password.ts`, `api/auth/reset-password.ts`, `api/attendance/me.ts`, `api/attendance/self.ts`, `api/events.ts`, `api/notices.ts`, `api/security/events.ts`) is a one-line re-export of `server/vercel-handler.js`. They exist because a catch-all-only deployment (`api/[...path].ts`) returns **404 for `/api/*` right after every deploy** while the function propagates — the per-route stubs are statically edge-mapped and are immune. This was a production incident (three times: auth, then security gate events, then member attendance/events/notices). `api/[...path].ts` remains as the catch-all for all other routes.

2. **Hard limit: 12 serverless functions per deployment on the Vercel Hobby plan.** The project currently uses 10 (9 stubs + catch-all). Adding new API routes does **not** need new stubs — just add the route in `server/index.ts` and the catch-all serves it. Only add a stub for a business-critical route, and keep the total ≤ 11.

3. **`vercel.json` must keep** `outputDirectory: dist`, the `api/**/*.ts` functions config, and `"postinstall": "prisma generate"` in `package.json` (pnpm blocks dependency build scripts, so without it the generated Prisma client is missing in some build stages).

4. **The TypeScript errors about `@prisma/client` / express types in the Vercel build log are known, non-fatal artifacts** of Vercel's isolated per-function type-check (pnpm symlinks don't resolve there). The build compiles with esbuild and deploys fine. Do not "fix" them by changing imports or regenerating things.

5. The frontend API client (`src/api.ts`) retries a 404/503 once on safe requests (reads + login) to absorb the brief post-deploy propagation window. Keep that behavior.

6. **`server/index.ts` must stay self-contained — no relative imports from other files in `server/`.** Vercel's serverless packaging does not emit sibling files into the function bundle; `import ... from './security'` crashed the entire API at cold start (`ERR_MODULE_NOT_FOUND`), 500ing every route. Inline small helpers instead (`server/security.ts` is kept for standalone scripts like `scripts/bootstrap-admin.ts`). Use explicit `.js` extensions if a relative import is ever unavoidable.

## Working conventions

- Run `npm run lint` (tsc) and `npm run build` after changes; both must pass.
- Member lists in the admin dashboard use the shared `src/components/admin/ViewControls.tsx` (search + list/cards toggle). Reuse it for any new roster UI.
- The app is a PWA with `registerType: 'autoUpdate'` — clients reload automatically when a new deploy ships. Account for users hitting fresh deployments instantly.
- Local dev: `npm run dev` runs the API on port 3001 and Vite on 3000 with `/api` proxied. Requires `.env` (see `.env.example`; never commit it).

## UI translations (i18n)

- All user-facing strings go through `src/data/i18n`: `const { t, locale, setLocale, dateLocale } = useTranslation()` from `src/data/i18n`, then `t('security.hello', { name })`. Components re-render automatically on locale change. A standalone `t()` export exists for module-level/helper use.
- `locales/en.ts` is the typed source of truth and the runtime fallback: every new user-facing string needs an `en.ts` key first. Keep `{placeholder}` tokens identical across locales. Month/weekday names are NOT dictionary keys — use `new Intl.DateTimeFormat(dateLocale, …)`.
- Active locales are English, Sesotho (`st`) and Setswana (`tn`). To add one: create `locales/<code>.ts` (`DeepPartial<Translation>`), then add it to `LOCALES` and `dictionaries` in `src/data/i18n/index.ts`. Never translate brand/church terms (IPHC, MMUSO, Kgotso, Karolo, Silo, FLG).
- The picker lives in ProfileView's "Preferences" card. The choice persists to localStorage (`iphc-locale`) only — nothing server-side.
- The security gate portal (`SecurityPortal.tsx`) uses the dedicated `security.*` namespace; its redesign uses the app palette (navy `#0A2A52`, blue `#3F76C5`, red `#D13138`, yellow accents) with a floating pill bottom nav.

## API route inventory (do not drop)

`server/index.ts` must always expose every route the frontend calls (`src/api.ts` is the contract). A rewrite once dropped these and every screen showed generic errors:

- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` (Resend + `password_reset_tokens`)
- `GET /api/admin/users`, `POST /api/admin/users`
- `GET|POST /api/admin/events`, `POST /api/admin/events/:id/publish`, `POST /api/admin/events/:id/archive`
- `GET /api/events`, `GET /api/notices` (member-facing)
- `GET /api/attendance/me`, `POST /api/attendance/self`
- `GET /api/security/events`, `POST /api/security/attendance`

The Prisma schema must keep the `password_reset_tokens` and `notices` models (tables already exist in the DB via migrations) and the `SECURITY` value in `AppRole` — dropping any of these breaks login for gate staff or the reset flow with enum/decoding errors.
