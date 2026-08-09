import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifySpecPreviewToken } from './specPreviewToken';

/**
 * This token goes out in an SMS to a business owner. It is what makes it
 * unnecessary to send `admin_bypass`, whose single global secret would grant
 * the recipient — and anyone they forwarded the text to — preview access to
 * every gated tenant on the platform, paying customers included.
 *
 * So the properties below are the whole point of the token existing.
 */

const SECRET = 'spec-preview-test-secret';
const TENANT_A = 'tenant-aaaaaaaa';
const TENANT_B = 'tenant-bbbbbbbb';

function mint(tenantId: string, opts: { ttl?: number; kind?: string; secret?: string } = {}) {
  const payload = Buffer.from(
    JSON.stringify({
      tenantId,
      kind: opts.kind ?? 'spec_preview',
      exp: Math.floor(Date.now() / 1000) + (opts.ttl ?? 3600),
    })
  ).toString('base64url');
  const signature = createHmac('sha256', opts.secret ?? SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

beforeEach(() => {
  process.env.SPEC_PREVIEW_SECRET = SECRET;
});
afterEach(() => {
  delete process.env.SPEC_PREVIEW_SECRET;
  delete process.env.CONTENT_EDITOR_SECRET;
});

describe('verifySpecPreviewToken', () => {
  it('opens the tenant it was minted for', () => {
    expect(verifySpecPreviewToken(mint(TENANT_A), TENANT_A)).toBe(true);
  });

  it('does NOT open a different tenant', () => {
    // The property that makes this safe to text to a stranger.
    expect(verifySpecPreviewToken(mint(TENANT_A), TENANT_B)).toBe(false);
  });

  it('refuses an expired token', () => {
    // Bounds the damage of a forwarded link once the offer has lapsed.
    expect(verifySpecPreviewToken(mint(TENANT_A, { ttl: -10 }), TENANT_A)).toBe(false);
  });

  it('refuses a tampered payload or signature', () => {
    const token = mint(TENANT_A);
    const [payload, signature] = token.split('.');
    expect(verifySpecPreviewToken(`${payload}x.${signature}`, TENANT_A)).toBe(false);
    expect(verifySpecPreviewToken(`${payload}.${signature}x`, TENANT_A)).toBe(false);
    expect(verifySpecPreviewToken(mint(TENANT_A, { secret: 'wrong' }), TENANT_A)).toBe(false);
  });

  it('refuses a token of another kind signed with the same secret', () => {
    // Content-editor tokens share a secret fallback but are minted for admins.
    // The two must not be interchangeable.
    expect(verifySpecPreviewToken(mint(TENANT_A, { kind: 'content_editor' }), TENANT_A)).toBe(
      false
    );
  });

  it('refuses everything when no secret is configured', () => {
    const token = mint(TENANT_A);
    delete process.env.SPEC_PREVIEW_SECRET;
    expect(verifySpecPreviewToken(token, TENANT_A)).toBe(false);
  });

  it('refuses missing or malformed input', () => {
    expect(verifySpecPreviewToken(null, TENANT_A)).toBe(false);
    expect(verifySpecPreviewToken(mint(TENANT_A), undefined)).toBe(false);
    expect(verifySpecPreviewToken('not-a-token', TENANT_A)).toBe(false);
  });
});
