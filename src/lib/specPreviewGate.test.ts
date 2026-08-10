import { describe, expect, it } from 'vitest';
import { getSiteGate } from './siteGate';
import type { BrandConfig } from '@/types/config';

/**
 * The password screen only ever appears when the gate says 'pending'. Anything
 * that opens the gate therefore skips the password by construction — that is
 * the mechanism, and these pin it so a reordering cannot quietly reintroduce a
 * prompt for people who should never see one.
 */
const spec = (over: Partial<BrandConfig> = {}) =>
  ({
    siteStatus: 'pending_approval',
    specPreviewPasswordHash: 'some-hash',
    ...over,
  }) as BrandConfig;

/** How both page routes decide whether to show the password screen. */
const showsPasswordScreen = (config: BrandConfig, opened: boolean) =>
  getSiteGate(config, opened) === 'pending' && !!config.specPreviewPasswordHash;

describe('who is asked for the spec preview password', () => {
  it('asks a stranger who just has the link', () => {
    expect(showsPasswordScreen(spec(), false)).toBe(true);
  });

  it('never asks an admin using admin_bypass', () => {
    // Whether the lead was scraped or typed in by hand, an operator must be
    // able to open the site to review it without hunting for a password.
    expect(showsPasswordScreen(spec(), true)).toBe(false);
    expect(getSiteGate(spec(), true)).toBe('ok');
  });

  it('never asks once the business has accepted and the lock is lifted', () => {
    // adoptSpecBuild clears the hash; asking a paying owner for a code to see
    // their own site would be absurd.
    expect(showsPasswordScreen(spec({ specPreviewPasswordHash: undefined }), false)).toBe(false);
  });

  it('never asks on a live site', () => {
    expect(showsPasswordScreen(spec({ siteStatus: 'active' }), false)).toBe(false);
  });

  it('still blocks a suspended site outright rather than offering a password', () => {
    expect(getSiteGate(spec({ siteStatus: 'suspended' }), false)).toBe('blocked');
  });
});
