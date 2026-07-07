import { describe, it, expect } from 'vitest';
import { mapRowToConfig, type SupabaseConfigRow } from './configMapper';

function buildRow(overrides?: {
  tenantsAsArray?: boolean;
  configsAsArray?: boolean;
  layoutStyle?: string;
  navLinks?: unknown;
  pagesConfig?: unknown;
  widgetId?: string;
}): SupabaseConfigRow {
  const config = {
    brand_name: 'Lumina Closets',
    theme: 'brutalist',
    layout_style: overrides?.layoutStyle ?? 'editorial',
    default_room: 'Walk-In Closet',
    hero_config: { headline: 'Hi', backgroundImage: 'a.jpg' },
    about_config: { description: 'about' },
    process_config: { title: 'P', subtitle: 'S', steps: [] },
    products_config: [],
    seo_config: {
      legalName: 'Lumina LLC',
      phone: '',
      streetAddress: '',
      addressLocality: '',
      addressRegion: '',
      postalCode: '',
      geo: { latitude: '', longitude: '' },
    },
    before_after_config: { beforeImage: 'b', afterImage: 'a', title: 't', subtitle: 's' },
    nav_links: overrides?.navLinks,
    pages_config: overrides?.pagesConfig,
  };
  const tenant = {
    widget_id: overrides?.widgetId ?? 'tenant-123',
    site_status: 'active',
    site_configs: overrides?.configsAsArray ? [config] : config,
  };
  return {
    hostname: 'lumina.localhost',
    tenants: overrides?.tenantsAsArray ? [tenant] : tenant,
  } as unknown as SupabaseConfigRow;
}

describe('mapRowToConfig', () => {
  it('maps the core fields including the previously-dropped layoutStyle', () => {
    const config = mapRowToConfig(buildRow({ layoutStyle: 'editorial' }));
    expect(config).not.toBeNull();
    expect(config!.brandName).toBe('Lumina Closets');
    expect(config!.theme).toBe('brutalist');
    expect(config!.layoutStyle).toBe('editorial');
    expect(config!.defaultRoom).toBe('Walk-In Closet');
    expect(config!.widgetId).toBe('tenant-123');
    expect(config!.siteStatus).toBe('active');
  });

  it('normalizes array-shaped tenants and site_configs relations', () => {
    const fromArrays = mapRowToConfig(buildRow({ tenantsAsArray: true, configsAsArray: true }));
    const fromObjects = mapRowToConfig(buildRow({ tenantsAsArray: false, configsAsArray: false }));
    expect(fromArrays).toEqual(fromObjects);
  });

  it('defaults navLinks and pagesConfig to empty arrays when absent', () => {
    const config = mapRowToConfig(buildRow({ navLinks: null, pagesConfig: undefined }));
    expect(config!.navLinks).toEqual([]);
    expect(config!.pagesConfig).toEqual([]);
  });

  it('falls back to an empty widgetId when the tenant has none', () => {
    const row = buildRow();
    (row.tenants as { widget_id?: string }).widget_id = undefined;
    expect(mapRowToConfig(row)!.widgetId).toBe('');
  });

  it('returns null when the tenant is missing', () => {
    expect(mapRowToConfig({ hostname: 'x', tenants: null })).toBeNull();
  });

  it('returns null when the site config is missing', () => {
    const row = buildRow();
    (row.tenants as { site_configs?: unknown }).site_configs = null;
    expect(mapRowToConfig(row)).toBeNull();
  });

  it('debugs database config', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(
      'https://vtlvqatzsolycqzeknru.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bHZxYXR6c29seWNxemVrbnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzMxNDEsImV4cCI6MjA4MDAwOTE0MX0.vDy9lhF6_2NUswkGOlg4xi8JgQN-AYfUUkdLryR6iZc'
    );
    const d1 = await sb.from('domains').select('*').eq('hostname', 'javiel-bespoke.localhost');
    console.log("DOMAINS ALONE:", JSON.stringify(d1, null, 2));

    if (d1.data && d1.data.length > 0) {
      const tenantId = d1.data[0].tenant_id;
      const t1 = await sb.from('tenants').select('*').eq('id', tenantId);
      console.log("TENANTS ALONE:", JSON.stringify(t1, null, 2));

      const sc1 = await sb.from('site_configs').select('*').eq('tenant_id', tenantId);
      console.log("SITE_CONFIGS ALONE:", JSON.stringify(sc1, null, 2));
    }
  });
});
