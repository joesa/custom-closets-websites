import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths owned by the dashboard app (login, tenant dashboard, admin, billing,
// signup, password flows). When a tenant subdomain (or a verified custom
// domain) is hit at one of these paths, we proxy the dashboard app instead of
// trying to render it as a tenant site page — otherwise the [hostname]/[slug]
// catch-all below would treat "/login" as a page slug. This is a rewrite, not
// a redirect, so the customer keeps seeing their own hostname in the URL bar.
const RESERVED_APP_PATH_PREFIXES = [
  '/login',
  '/dashboard',
  '/admin',
  '/billing',
  '/signup',
  '/get-started',
  '/forgot-password',
  '/update-password',
  '/force-password-reset',
  '/auth',
];

// API routes this renderer owns. Everything else under /api belongs to the
// dashboard app and must be proxied, because the proxied dashboard pages call
// their API routes with same-origin relative URLs.
const RENDERER_API_PATH_PREFIXES = ['/api/a', '/api/revalidate'];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function dashboardAppOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, '') ||
    'https://www.ditchtheform.com'
  );
}

export function proxy(req: NextRequest) {
  const url = req.nextUrl;

  // Get the hostname (e.g., 'lumina.ditchtheform.com' or 'localhost:3000')
  let hostname = req.headers.get('host') || '';

  // Remove the port if running locally
  hostname = hostname.split(':')[0];

  const dashboardOrigin = dashboardAppOrigin();
  const isDashboardHost = (() => {
    try {
      return new URL(dashboardOrigin).hostname === hostname;
    } catch {
      return false;
    }
  })();

  const isApiPath = url.pathname === '/api' || url.pathname.startsWith('/api/');

  // Renderer-owned API routes are served here and never hostname-rewritten.
  if (isApiPath && matchesPrefix(url.pathname, RENDERER_API_PATH_PREFIXES)) {
    return NextResponse.next();
  }

  // Dashboard-owned paths on a tenant hostname → proxy to the dashboard app so
  // the browser URL stays on the customer's domain.
  if (
    !isDashboardHost &&
    (isApiPath || matchesPrefix(url.pathname, RESERVED_APP_PATH_PREFIXES))
  ) {
    const dest = new URL(`${url.pathname}${url.search}`, dashboardOrigin);
    const headers = new Headers(req.headers);
    headers.set('x-tenant-host', hostname);
    return NextResponse.rewrite(dest, { request: { headers } });
  }

  if (isApiPath) {
    return NextResponse.next();
  }

  // Silently rewrite the request to a dynamic route folder: /app/[hostname]/...
  // We keep the rest of the pathname intact so /api or other routes could theoretically work
  // if nested, but the main page is /app/[hostname]/page.tsx
  url.pathname = `/${hostname}${url.pathname}`;
  // Check for admin_bypass. Only honor it when ADMIN_BYPASS_SECRET is configured
  // and the provided value matches exactly — never fall back to a hardcoded
  // literal, which would let anyone preview pending/suspended sites.
  const adminBypass = url.searchParams.get('admin_bypass');
  const bypassSecret = process.env.ADMIN_BYPASS_SECRET;
  const response = NextResponse.rewrite(url);
  const wantDraft = url.searchParams.get('draft') === '1';

  const bypassFromQuery = Boolean(bypassSecret && adminBypass === bypassSecret);
  if (bypassFromQuery) {
    response.cookies.set('admin_bypass', 'true', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  // The spec-preview token arrives once, in a link we texted. Clicking any nav
  // item would drop the query param and dump the business owner on the
  // under-construction page, so pin it to a cookie for the rest of the visit.
  // Host-scoped by default (no Domain attribute), which is what stops one
  // tenant's token being presented at another tenant's hostname.
  const specPreviewToken = url.searchParams.get('spec_preview_token');
  if (specPreviewToken) {
    response.cookies.set('spec_preview_token', specPreviewToken, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 9,
    });
  }

  // Draft preview cookie is only for layout chrome (skip engine Navbar).
  // Always clear it unless this request explicitly asks for ?draft=1 — otherwise
  // "Visit live site" after Preview kept showing the yellow DRAFT PREVIEW banner.
  const isAdmin =
    bypassFromQuery || req.cookies.get('admin_bypass')?.value === 'true';
  if (wantDraft && isAdmin) {
    response.cookies.set('custom_draft_preview', 'true', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
    });
  } else if (!wantDraft) {
    response.cookies.set('custom_draft_preview', '', {
      path: '/',
      maxAge: 0,
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, images, static files). /api is matched so
    // dashboard-owned API routes can be proxied from tenant hostnames.
    '/((?!_next/static|_next/image|favicon.ico|brands|widget.js).*)',
  ],
};
