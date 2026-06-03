import { describe, expect, it } from 'vitest';
import { getSiteGate } from './siteGate';
import type { BrandConfig } from '@/types/config';

function config(siteStatus: string, launchPayUrl?: string): BrandConfig {
  return {
    brandName: 'Test Co',
    theme: 'modern',
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

  it('bypasses gate for admin preview', () => {
    expect(getSiteGate(config('awaiting_launch_payment'), true)).toBe('ok');
  });

  it('blocks suspended tenants', () => {
    expect(getSiteGate(config('suspended'), false)).toBe('blocked');
  });
});
