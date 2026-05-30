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

// Shape of the nested row returned by the domains->tenants->site_configs join.
// Relations may come back as a single object or a one-element array.
type SiteConfigRow = {
  brand_name: string;
  theme: string;
  layout_style?: string;
  default_room?: string;
  hero_config: BrandConfig['hero'];
  about_config: BrandConfig['about'];
  process_config: ProcessConfig;
  products_config: Product[];
  seo_config: SEOConfig;
  before_after_config: BeforeAfterConfig;
  nav_links?: NavLink[] | null;
  pages_config?: PageConfig[] | null;
};
type TenantRow = {
  widget_id?: string;
  site_status?: string;
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

  return {
    brandName: configRow.brand_name,
    theme: configRow.theme as ThemeType,
    hero: configRow.hero_config,
    about: configRow.about_config,
    process: configRow.process_config,
    products: configRow.products_config,
    seo: configRow.seo_config,
    beforeAfter: configRow.before_after_config,
    widgetId: tenant.widget_id ?? '',
    defaultRoom: configRow.default_room,
    layoutStyle: configRow.layout_style,
    siteStatus: tenant.site_status,
    navLinks: configRow.nav_links || [],
    pagesConfig: configRow.pages_config || [],
  };
}
