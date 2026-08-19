import { describe, expect, it } from 'vitest';
import { readAnalyticsConfig } from './TenantAnalytics';

/**
 * The values are interpolated into a page on the tenant's own domain, so the
 * validation is the security boundary — not a formatting nicety.
 */
describe('readAnalyticsConfig', () => {
  it('accepts a well-formed GA4 id', () => {
    expect(readAnalyticsConfig({ ga4: 'G-ABC1234567' }).ga4).toBe('G-ABC1234567');
  });

  it('accepts a plausible domain', () => {
    expect(readAnalyticsConfig({ plausible: 'example.com' }).plausible).toBe('example.com');
  });

  it('accepts both together', () => {
    const result = readAnalyticsConfig({ ga4: 'G-ABC1234567', plausible: 'example.com' });
    expect(result).toEqual({ ga4: 'G-ABC1234567', plausible: 'example.com' });
  });

  it('trims surrounding whitespace', () => {
    expect(readAnalyticsConfig({ ga4: '  G-ABC1234567  ' }).ga4).toBe('G-ABC1234567');
  });

  it.each([
    ['a script tag', '<script>alert(1)</script>'],
    ['a quote break-out', "G-ABC');alert(1);//"],
    ['a url', 'https://evil.example/x.js'],
    ['an empty string', ''],
    ['the wrong prefix', 'UA-12345-6'],
  ])('drops %s in the ga4 field', (_label, value) => {
    expect(readAnalyticsConfig({ ga4: value }).ga4).toBeNull();
  });

  it.each([
    ['a script tag', '<script>alert(1)</script>'],
    ['a path', 'example.com/x"></script>'],
    ['a space', 'example .com'],
  ])('drops %s in the plausible field', (_label, value) => {
    expect(readAnalyticsConfig({ plausible: value }).plausible).toBeNull();
  });

  it.each([null, undefined, 'string', 42, []])('returns empty for %s', (raw) => {
    const result = readAnalyticsConfig(raw);
    expect(result.ga4 ?? null).toBeNull();
    expect(result.plausible ?? null).toBeNull();
  });

  it('ignores non-string values in the right-shaped object', () => {
    expect(readAnalyticsConfig({ ga4: { toString: () => 'G-ABC1234567' } }).ga4).toBeNull();
  });
});
