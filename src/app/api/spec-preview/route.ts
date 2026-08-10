import { NextResponse } from 'next/server';
import { getActiveConfig } from '@/lib/getConfig';
import { mintSpecPreviewToken, verifySpecPreviewPassword } from '@/lib/specPreviewToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Unlock a spec preview with the password from the offer text.
 *
 * On success this mints the same `spec_preview_token` the gate already accepts
 * and stores it in a host-scoped, httpOnly cookie, so the rest of the visit —
 * every nav click — just works. One unlock mechanism, not two.
 *
 * Host-scoped matters: the cookie is only ever presented back to the hostname
 * that issued it, so unlocking one spec site cannot open another.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const password = String(form?.get('password') ?? '');
  const back = String(form?.get('next') ?? '/');

  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '')
    .split(':')[0]
    .toLowerCase();
  const config = await getActiveConfig(host);

  if (!config?.tenantId || !config.specPreviewPasswordHash) {
    return NextResponse.redirect(new URL('/', req.url), 303);
  }

  if (!verifySpecPreviewPassword(password, config.specPreviewPasswordHash)) {
    const retry = new URL(back.startsWith('/') ? back : '/', req.url);
    retry.searchParams.set('preview_error', '1');
    return NextResponse.redirect(retry, 303);
  }

  const target = new URL(back.startsWith('/') ? back : '/', req.url);
  target.searchParams.delete('preview_error');
  const res = NextResponse.redirect(target, 303);
  res.cookies.set('spec_preview_token', mintSpecPreviewToken(config.tenantId), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 9,
  });
  return res;
}
