import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

/**
 * On-demand cache invalidation for `getActiveConfig`'s per-hostname
 * `unstable_cache` (tagged `site-config`, revalidate: 60s in `getConfig.ts`).
 *
 * Auth: prefer `REVALIDATE_SECRET`. Temporarily also accepts
 * `ADMIN_BYPASS_SECRET` so older dashboard deploys keep working during cutover.
 * Preview cookies continue to use ADMIN_BYPASS_SECRET only (see proxy.ts).
 */
export async function POST(req: NextRequest) {
  const revalidateSecret = process.env.REVALIDATE_SECRET?.trim();
  const legacySecret = process.env.ADMIN_BYPASS_SECRET?.trim();
  const provided = req.headers.get('x-revalidate-secret')?.trim();

  const accepted =
    !!provided &&
    ((!!revalidateSecret && provided === revalidateSecret) ||
      (!!legacySecret && provided === legacySecret));

  if (!accepted) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // { expire: 0 } forces immediate expiration (vs. profile "max"'s
  // stale-while-revalidate), since this is called right after a tenant
  // deploy/redeploy and the admin expects to see the new site on the very
  // next request, not after one more stale serve.
  revalidateTag('site-config', { expire: 0 });
  return NextResponse.json({ revalidated: true, tag: 'site-config' });
}
