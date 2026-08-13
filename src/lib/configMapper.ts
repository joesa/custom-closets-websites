import {
  BrandConfig,
  BeforeAfterConfig,
  NavLink,
  PageConfig,
  ProcessConfig,
  Product,
  SEOConfig,
  ThemeType,
} from '@/types/config';
import { isCustomSiteConfig, type CustomSiteConfig } from '@/lib/customSite';

// Shape of the nested row returned by the domains->tenants->site_configs join.
// Relations may come back as a single object or a one-element array.
type SiteConfigRow = {
  brand_name: string;
  industry?: string | null;
  theme: string;
  layout_style?: string;
  default_room?: string;
  hero_config: BrandConfig['hero'];
  about_config: BrandConfig['about'];
  process_config: ProcessConfig;
  products_config: Product[];
  seo_config: SEOConfig;
  before_after_config?: BeforeAfterConfig | null;
  nav_links?: NavLink[] | null;
  pages_config?: PageConfig[] | null;
  logo_url?: string | null;
  pricing_notes?: string | null;
  launch_pay_url?: string | null;
  spec_preview_password_hash?: string | null;
  design_variant?: string | null;
  theme_tokens?: BrandConfig['themeTokens'] | null;
  quiz_config?: BrandConfig['quiz'] | null;
  engagement_model?: string | null;
  render_mode?: string | null;
  edit_in_place?: boolean | null;
  custom_config?: CustomSiteConfig | null;
  custom_config_draft?: CustomSiteConfig | null;
  engine_config_draft?: {
    pagesConfig?: PageConfig[];
    navLinks?: NavLink[];
  } | null;
  content_structure?: BrandConfig['contentStructure'] | null;
  content_version?: number | null;
};
type TenantRow = {
  id?: string;
  widget_id?: string;
  site_status?: string;
  temp_preview_expires_at?: string | null;
  validation_status?: string | null;
  site_configs?: SiteConfigRow | SiteConfigRow[] | null;
};
export type SupabaseConfigRow = {
  hostname?: string;
  tenants?: TenantRow | TenantRow[] | null;
};

/**
 * Map a `domains -> tenants -> site_configs` Supabase row into a BrandConfig.
 * Pure (no I/O) so it can be unit-tested. Supabase returns nested relations as
 * either an object or a single-element array depending on the join, so both
 * shapes are normalized here. Returns null when the tenant or config is missing.
 */
export function mapRowToConfig(data: SupabaseConfigRow): BrandConfig | null {
  // We are heavily relying on the hybrid Relational + JSONB schema
  // So the data from Supabase maps almost exactly to BrandConfig
  const tenant = Array.isArray(data.tenants) ? data.tenants[0] : data.tenants;
  if (!tenant) return null;
  const configRow = Array.isArray(tenant.site_configs) ? tenant.site_configs[0] : tenant.site_configs;

  if (!configRow) return null;

  const processRow = configRow.process_config as ProcessConfig & {
    signatureMotif?: NonNullable<BrandConfig['signature']>['motif'];
    signatureEyebrow?: string;
  };
  const signature =
    processRow?.signatureMotif || processRow?.signatureEyebrow
      ? {
          processName: processRow.title,
          motif: processRow.signatureMotif,
          eyebrow: processRow.signatureEyebrow,
        }
      : undefined;

  return {
    brandName: configRow.brand_name,
    industry: configRow.industry ?? undefined,
    theme: configRow.theme as ThemeType,
    hero: configRow.hero_config,
    about: configRow.about_config,
    process: configRow.process_config,
    products: configRow.products_config,
    seo: configRow.seo_config,
    beforeAfter: configRow.before_after_config ?? undefined,
    widgetId: tenant.widget_id ?? '',
    tenantId: tenant.id ?? undefined,
    defaultRoom: configRow.default_room,
    layoutStyle: configRow.layout_style,
    siteStatus: tenant.site_status,
    tempPreviewExpiresAt: tenant.temp_preview_expires_at ?? undefined,
    specPreviewPasswordHash: configRow.spec_preview_password_hash ?? undefined,
    validationStatus: tenant.validation_status ?? undefined,
    navLinks: configRow.nav_links || [],
    pagesConfig: configRow.pages_config || [],
    logoUrl: configRow.logo_url ?? undefined,
    pricingNotes: configRow.pricing_notes ?? undefined,
    launchPayUrl: configRow.launch_pay_url ?? undefined,
    designVariant: configRow.design_variant ?? undefined,
    quiz: configRow.quiz_config ?? undefined,
    socialProof: configRow.seo_config?.socialProof ?? undefined,
    engagementModel: (configRow.engagement_model as 'quote' | 'order' | 'booking' | 'ticket') || 'quote',
    themeTokens: configRow.theme_tokens ?? undefined,
    signature,
    renderMode: configRow.render_mode === 'custom' ? 'custom' : 'engine',
    editInPlace: Boolean(configRow.edit_in_place),
    customConfig: isCustomSiteConfig(configRow.custom_config) ? configRow.custom_config : null,
    customConfigDraft: isCustomSiteConfig(configRow.custom_config_draft)
      ? configRow.custom_config_draft
      : null,
    engineConfigDraft:
      configRow.engine_config_draft &&
      Array.isArray(configRow.engine_config_draft.pagesConfig) &&
      Array.isArray(configRow.engine_config_draft.navLinks)
        ? {
            pagesConfig: configRow.engine_config_draft.pagesConfig,
            navLinks: configRow.engine_config_draft.navLinks,
          }
        : null,
    contentStructure: configRow.content_structure ?? undefined,
    contentVersion: Number(configRow.content_version || 1),
  };
}
