import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

/**
 * On-demand cache invalidation for `getActiveConfig`'s per-hostname
 * `unstable_cache` (tagged `site-config`, revalidate: 60s in `getConfig.ts`).
 *
 * Without this, a freshly (re)provisioned tenant can keep serving its
 * previous nav/theme/copy for up to 60s — restarting a server or hard-
 * refreshing the browser does nothing, since the stale value lives in this
 * app's own server-side data cache, not the browser or the caller's process.
 *
 * Called by `closet-dashboard`'s provisioning flow right after a tenant's
 * site config is written. Shares `ADMIN_BYPASS_SECRET` with `proxy.ts` rather
 * than introducing a second cross-app secret.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_BYPASS_SECRET?.trim();
  const provided = req.headers.get('x-revalidate-secret')?.trim();

  if (!secret || !provided || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // { expire: 0 } forces immediate expiration (vs. profile "max"'s
  // stale-while-revalidate), since this is called right after a tenant
  // deploy/redeploy and the admin expects to see the new site on the very
  // next request, not after one more stale serve.
  revalidateTag('site-config', { expire: 0 });
  return NextResponse.json({ revalidated: true, tag: 'site-config' });
}
