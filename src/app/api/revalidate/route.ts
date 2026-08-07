import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

/**
 * On-demand cache invalidation for `getActiveConfig`'s per-hostname
 * `unstable_cache` (tagged `site-config`, revalidate: 60s in `getConfig.ts`).
 *
 * Auth: `REVALIDATE_SECRET` via `x-revalidate-secret` header only.
 * Preview cookies continue to use ADMIN_BYPASS_SECRET (see proxy.ts).
 */
export async function POST(req: NextRequest) {
  const revalidateSecret = process.env.REVALIDATE_SECRET?.trim();
  const provided = req.headers.get('x-revalidate-secret')?.trim();

  if (!revalidateSecret || !provided || provided !== revalidateSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { hostnames?: unknown } | null;
  const requestHost = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '')
    .split(':')[0]
    .trim()
    .toLowerCase();
  const requested = Array.isArray(body?.hostnames)
    ? body.hostnames.filter((host): host is string => typeof host === 'string')
    : [];
  const hostnames = [...new Set([requestHost, ...requested]
    .map((host) => host.trim().toLowerCase())
    .filter((host) => /^[a-z0-9.-]+$/.test(host)))];
  if (hostnames.length === 0) {
    return NextResponse.json({ error: 'No hostname to revalidate' }, { status: 400 });
  }

  // { expire: 0 } forces immediate expiration (vs. profile "max"'s
  // stale-while-revalidate), since this is called right after a tenant
  // deploy/redeploy and the admin expects to see the new site on the very
  // next request, not after one more stale serve.
  for (const hostname of hostnames) {
    revalidateTag(`site-config:${hostname}`, { expire: 0 });
  }
  return NextResponse.json({ revalidated: true, tags: hostnames.map((host) => `site-config:${host}`) });
}
