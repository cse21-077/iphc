# IPHC MMUSO

The official IPHC church member app for Silo Zuurbekom: digital membership card, QR check-in, Silo calendar, payments (Karolo), FLG Empire directory, media, and a national admin dashboard.

## Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, vite-plugin-pwa (installable, auto-updating)
- **API**: Express (`server/index.ts`), deployed as Vercel serverless functions
- **Database**: PostgreSQL via Prisma (Supabase), Supabase Auth for identities

## Local development

```bash
cp .env.example .env   # fill in DATABASE_URL, SUPABASE_* keys, RESEND_API_KEY
npm install
npm run dev            # API on :3001, Vite on :3000 (proxies /api)
```

Verify before pushing:

```bash
npm run lint   # tsc --noEmit
npm run build  # vite build
```

## Deployment (GitHub → Vercel)

Pushes to `main` auto-deploy. Three things are easy to break — documented here and in `AGENTS.md`:

1. **Post-deploy 404s on `/api/*`**: fixed by the per-route stubs in `api/` (`api/auth/me.ts`, `login.ts`, `forgot-password.ts`, `reset-password.ts`). They look redundant but prevent the Vercel function-propagation 404 window. Do not delete them; do not add more than needed.
2. **12-function Hobby limit**: the deployment must stay ≤ 12 serverless functions (currently 5). New API routes only require changes in `server/index.ts` — the `api/[...path].ts` catch-all serves them.
3. **Benign build-log noise**: the Vercel build prints TypeScript errors about `@prisma/client`/express types during the isolated per-function type-check. They are cosmetic (esbuild compiles; the build completes) — ignore them.

Password-reset emails require `RESEND_API_KEY` in the Vercel environment variables (from the Resend account where `iphc-silo.com` is verified — the sender `MMUSO <noreply@iphc-silo.com>` is hardcoded in `server/index.ts`), and the server logs every send attempt with a `[resend]` prefix.
