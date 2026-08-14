import { describe, expect, it } from 'vitest';
import { getSiteGate } from './siteGate';
import type { BrandConfig } from '@/types/config';

function config(siteStatus: string, launchPayUrl?: string): BrandConfig {
  return {
    brandName: 'Test Co',
    theme: 'luxury-minimal',
    hero: {} as BrandConfig['hero'],
    about: {} as BrandConfig['about'],
    process: {} as BrandConfig['process'],
    products: [],
    seo: {} as BrandConfig['seo'],
    beforeAfter: {} as BrandConfig['beforeAfter'],
    widgetId: 'w1',
    siteStatus,
    launchPayUrl,
  };
}

describe('getSiteGate', () => {
  it('shows launch paywall when awaiting launch payment', () => {
    expect(getSiteGate(config('awaiting_launch_payment', 'https://pay'), false)).toBe(
      'launch_locked'
    );
  });

  it('opens an unpaid site during an active temporary preview window', () => {
    const cfg = {
      ...config('awaiting_launch_payment', 'https://pay'),
      tempPreviewExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    };
    expect(getSiteGate(cfg, false)).toBe('ok');
  });

  it('closes the site as soon as a temporary preview expires', () => {
    const cfg = {
      ...config('awaiting_launch_payment', 'https://pay'),
      tempPreviewExpiresAt: new Date(Date.now() - 1).toISOString(),
    };
    expect(getSiteGate(cfg, false)).toBe('launch_locked');
  });

  it('does not let temporary preview bypass suspension', () => {
    const tempPreviewExpiresAt = new Date(Date.now() + 60_000).toISOString();
    expect(getSiteGate({ ...config('suspended'), tempPreviewExpiresAt }, false)).toBe('blocked');
  });

  it('bypasses gate for admin preview', () => {
    expect(getSiteGate(config('awaiting_launch_payment'), true)).toBe('ok');
  });

  it('blocks suspended tenants', () => {
    expect(getSiteGate(config('suspended'), false)).toBe('blocked');
  });

  // Regression guard for the 2026-08-13 outage: a single cosmetic finding (a
  // missing <h1>) used to blank an entire live site. Validation is enforced at
  // approval instead; it must never take a serving site down.
  it('keeps a live site serving when validation has failed', () => {
    const cfg = { ...config('active'), validationStatus: 'failed' };
    expect(getSiteGate(cfg, false)).toBe('ok');
  });

  it('keeps a client preview serving when validation has failed', () => {
    const tempPreviewExpiresAt = new Date(Date.now() + 60_000).toISOString();
    expect(
      getSiteGate(
        { ...config('awaiting_launch_payment'), validationStatus: 'failed', tempPreviewExpiresAt },
        false
      )
    ).toBe('ok');
  });

  it('still withholds an unapproved site whose validation failed', () => {
    const cfg = { ...config('pending_approval'), validationStatus: 'failed' };
    expect(getSiteGate(cfg, false)).toBe('pending');
  });

  it('admin bypass still wins over a failed validation status', () => {
    const cfg = { ...config('active'), validationStatus: 'failed' };
    expect(getSiteGate(cfg, true)).toBe('ok');
  });

  it('holds the public site offline while editInPlace is on', () => {
    const cfg = { ...config('active'), editInPlace: true };
    expect(getSiteGate(cfg, false)).toBe('edit_locked');
  });

  it('admin bypass still opens the site during editInPlace', () => {
    const cfg = { ...config('active'), editInPlace: true };
    expect(getSiteGate(cfg, true)).toBe('ok');
  });
});
