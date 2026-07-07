# Custom Closets Websites

Multi-tenant marketing sites for DitchTheForm contractors. One Next.js 16 (App
Router) deployment serves every contractor's site, resolving branding, content,
and theme per request from the hostname.

## How it works

- **Hostname routing** — middleware maps the incoming host to a tenant; pages
  render under `src/app/[hostname]` (home) and `src/app/[hostname]/[slug]`
  (sub-pages).
- **Config loading** — [`src/lib/getConfig.ts`](src/lib/getConfig.ts) reads the
  tenant + active `site_config` from Supabase and returns a `BrandConfig`
  (branding, content, `layoutStyle`, `siteStatus`, embedded `widget_id`). It is
  wrapped with React `cache()` for per-request dedupe and `unstable_cache()` for
  cross-request caching.
- **Theming** — 13 themes are defined centrally in
  [`src/lib/theme.ts`](src/lib/theme.ts). Components consume `getThemeStyles`
  and `getSectionTokens` so every section renders correctly for any theme.
- **Site gating** — [`src/lib/siteGate.ts`](src/lib/siteGate.ts) decides whether
  a site is `ok`, `pending`, or `blocked` based on `site_status` and the
  `admin_bypass` cookie. Suspended sites return 404; pending sites render a
  "pending approval" screen. Both the home page and sub-pages enforce this.
- **Widget embed** — each site embeds the [closet-widget](../closet-widget)
  using the tenant's `widget_id`.

Tenant content is authored in the [closet-dashboard](../closet-dashboard) (incl.
AI site generation) and provisioned into the shared Supabase project.

## Getting started

1. Copy the env template:

```bash
cp .env.example .env.local
```

2. Run the dev server:

```bash
npm install
npm run dev
```

To preview a specific tenant locally, map a hostname to `127.0.0.1` in your
hosts file (or use the host-resolution scheme your middleware expects) and open
it on the dev port.

## Scripts

- `npm run dev` — Next dev server.
- `npm run build` — production build.
- `npm run start` — serve the production build.
- `npm run lint` — ESLint.

## Environment

See [`.env.example`](.env.example): Supabase URL + anon key (read-only tenant
config) and `ADMIN_BYPASS_SECRET` for previewing gated sites. The anon key is
sufficient because all reads go through Supabase RLS.

## Deploy

Deploys to Vercel with a wildcard domain (and/or per-tenant custom domains)
pointing at this project. Set the Supabase variables and, if you want gated-site
previews, `ADMIN_BYPASS_SECRET`.
