import { describe, expect, it } from 'vitest';
import type { BrandConfig } from '@/types/config';
import { applyEngineDraftPreview } from './engineDraftPreview';

const config = {
  renderMode: 'engine',
  pagesConfig: [],
  navLinks: [{ label: 'Home', slug: '/' }],
  engineConfigDraft: {
    pagesConfig: [{ slug: '/about', title: 'About', hero: { headline: 'About' }, content_blocks: [] }],
    navLinks: [{ label: 'About', slug: '/about' }],
  },
} as unknown as BrandConfig;

describe('applyEngineDraftPreview', () => {
  it('keeps published config without exposing the unpublished draft', () => {
    const published = applyEngineDraftPreview(config, { enabled: false });
    expect(published.pagesConfig).toEqual(config.pagesConfig);
    expect(published).not.toHaveProperty('engineConfigDraft');
  });

  it('overlays engine pages and preserves preview navigation', () => {
    const preview = applyEngineDraftPreview(config, {
      enabled: true,
      previewQuery: 'draft=1&admin_bypass=secret',
    });
    expect(preview.pagesConfig).toEqual(config.engineConfigDraft?.pagesConfig);
    expect(preview.navLinks).toEqual([
      { label: 'About', slug: '/about?draft=1&admin_bypass=secret' },
    ]);
  });

  it('never overlays custom render mode', () => {
    const custom = { ...config, renderMode: 'custom' as const };
    const published = applyEngineDraftPreview(custom, { enabled: true });
    expect(published.pagesConfig).toEqual(custom.pagesConfig);
    expect(published).not.toHaveProperty('engineConfigDraft');
  });
});