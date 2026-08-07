import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { verifyContentEditorToken } from './contentEditorToken';

function token(body: Record<string, unknown>) {
  const payload = Buffer.from(JSON.stringify(body)).toString('base64url');
  const signature = createHmac('sha256', 'test-editor-secret').update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

describe('content editor preview tokens', () => {
  beforeEach(() => { process.env.CONTENT_EDITOR_SECRET = 'test-editor-secret'; });
  afterEach(() => { delete process.env.CONTENT_EDITOR_SECRET; });

  it('accepts a valid tenant-scoped token', () => {
    expect(verifyContentEditorToken(token({ tenantId: 'tenant-1', userId: 'user-1', exp: Math.floor(Date.now() / 1000) + 60 }), 'tenant-1')).toBe(true);
  });

  it('rejects cross-tenant, expired, and tampered tokens', () => {
    const valid = token({ tenantId: 'tenant-1', userId: 'user-1', exp: Math.floor(Date.now() / 1000) + 60 });
    expect(verifyContentEditorToken(valid, 'tenant-2')).toBe(false);
    expect(verifyContentEditorToken(token({ tenantId: 'tenant-1', exp: 1 }), 'tenant-1')).toBe(false);
    expect(verifyContentEditorToken(`${valid}x`, 'tenant-1')).toBe(false);
  });
});

