import { BrandConfig, ThemeType } from '@/types/config';
import { createClient } from '@supabase/supabase-js';

// Fallback if environment variables are missing during build/dev
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for edge
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getActiveConfig(hostname: string): Promise<BrandConfig | null> {
  // If we're hitting localhost:3000 directly without a subdomain, fallback to lumina
  // This is helpful for local development if the developer doesn't change their hosts file
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
    hostname = 'lumina.localhost';
  }

  // Query Supabase
  const { data, error } = await supabase
    .from('domains')
    .select(`
      hostname,
      tenants (
        widget_id,
        site_status,
        site_configs (
          brand_name,
          theme,
          layout_style,
          default_room,
          hero_config,
          about_config,
          process_config,
          products_config,
          seo_config,
          before_after_config
        )
      )
    `)
    .eq('hostname', hostname)
    .single();

  if (error || !data) {
    console.error(`Failed to load config for hostname: ${hostname}`, error);
    return null;
  }

  // We are heavily relying on the hybrid Relational + JSONB schema
  // So the data from Supabase maps almost exactly to BrandConfig
  const tenant = Array.isArray(data.tenants) ? data.tenants[0] : data.tenants;
  const configRow = Array.isArray(tenant.site_configs) ? tenant.site_configs[0] : tenant.site_configs;

  if (!tenant || !configRow) return null;

  return {
    brandName: configRow.brand_name,
    theme: configRow.theme as ThemeType,
    hero: configRow.hero_config,
    about: configRow.about_config,
    process: configRow.process_config,
    products: configRow.products_config,
    seo: configRow.seo_config,
    beforeAfter: configRow.before_after_config,
    widgetId: tenant.widget_id,
    defaultRoom: configRow.default_room,
    siteStatus: tenant.site_status,
  };
}
