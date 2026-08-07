import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyContentEditorToken(token: string | null | undefined, tenantId: string | undefined) {
  if (!token || !tenantId) return false;
  const secret = process.env.CONTENT_EDITOR_SECRET?.trim() || process.env.ADMIN_BYPASS_SECRET?.trim();
  if (!secret) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const expected = createHmac('sha256', secret).update(payload).digest();
  let actual: Buffer;
  let body: { tenantId?: unknown; exp?: unknown };
  try {
    actual = Buffer.from(signature, 'base64url');
    body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch { return false; }
  return actual.length === expected.length && timingSafeEqual(actual, expected) &&
    body.tenantId === tenantId && Number(body.exp) >= Math.floor(Date.now() / 1000);
}

