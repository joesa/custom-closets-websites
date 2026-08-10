import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verifier for the spec-preview token minted in the dashboard.
 *
 * Scoped to one tenant and expiring, so a forwarded link exposes at most the
 * one spec site it was issued for — unlike `admin_bypass`, whose single global
 * secret would expose every gated tenant on the platform.
 *
 * `kind` is checked so a content-editor token cannot be replayed here: those
 * are minted for admins with a short TTL, and the two must not be
 * interchangeable even though they share a secret fallback.
 */
export function verifySpecPreviewToken(
  token: string | null | undefined,
  tenantId: string | undefined
): boolean {
  if (!token || !tenantId) return false;
  const secret =
    process.env.SPEC_PREVIEW_SECRET?.trim() || process.env.CONTENT_EDITOR_SECRET?.trim();
  if (!secret) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = createHmac('sha256', secret).update(payload).digest();
  let actual: Buffer;
  let body: { tenantId?: unknown; exp?: unknown; kind?: unknown };
  try {
    actual = Buffer.from(signature, 'base64url');
    body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return false;
  }

  return (
    actual.length === expected.length &&
    timingSafeEqual(actual, expected) &&
    body.kind === 'spec_preview' &&
    body.tenantId === tenantId &&
    Number(body.exp) >= Math.floor(Date.now() / 1000)
  );
}

/**
 * Mint a preview token after a correct password.
 *
 * The renderer holds the same SPEC_PREVIEW_SECRET as the dashboard, so once the
 * password checks out it can issue the very token the gate already understands
 * — one unlock mechanism rather than two.
 */
export function mintSpecPreviewToken(tenantId: string, ttlSeconds = 9 * 24 * 60 * 60): string {
  const secret =
    process.env.SPEC_PREVIEW_SECRET?.trim() || process.env.CONTENT_EDITOR_SECRET?.trim();
  if (!secret) throw new Error('SPEC_PREVIEW_SECRET is not configured');
  const payload = Buffer.from(
    JSON.stringify({
      tenantId,
      kind: 'spec_preview',
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    })
  ).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

/** Constant-time check of a typed password against the stored hash. */
export function verifySpecPreviewPassword(
  password: string | null | undefined,
  storedHash: string | null | undefined
): boolean {
  if (!password || !storedHash) return false;
  const secret =
    process.env.SPEC_PREVIEW_SECRET?.trim() || process.env.CONTENT_EDITOR_SECRET?.trim();
  if (!secret) return false;

  const expected = createHmac('sha256', secret)
    .update(`spec-preview-hash:${password.trim().toUpperCase()}`)
    .digest('base64url');

  const a = Buffer.from(expected);
  const b = Buffer.from(storedHash);
  return a.length === b.length && timingSafeEqual(a, b);
}
