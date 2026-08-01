import type { BrandConfig } from '@/types/config';

export function applyEngineDraftPreview(
  config: BrandConfig,
  options: { enabled: boolean; previewQuery?: string }
): BrandConfig {
  const { engineConfigDraft, ...publicConfig } = config;
  if (!options.enabled || config.renderMode === 'custom' || !engineConfigDraft) {
    return publicConfig;
  }

  const suffix = options.previewQuery ? `?${options.previewQuery}` : '';
  return {
    ...publicConfig,
    pagesConfig: engineConfigDraft.pagesConfig,
    navLinks: engineConfigDraft.navLinks.map((link) => ({
      ...link,
      slug: suffix ? `${link.slug.split('?')[0]}${suffix}` : link.slug,
    })),
  };
}