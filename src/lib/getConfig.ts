import { BrandConfig } from '@/types/config';
import { createClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { mapRowToConfig, type SupabaseConfigRow } from './configMapper';

export { mapRowToConfig } from './configMapper';
export type { SupabaseConfigRow } from './configMapper';

// Lazily create the Supabase client on first use. Doing this at module scope
// would throw when env vars are absent (e.g. in unit tests) and would run a
// side effect just from importing this file's pure helpers.
//
// Prefers the service-role key when one is configured. This selection runs only
// on the server (a React Server Component render), so the key is never shipped
// to a browser.
//
// Why it matters: this query asks for `custom_config_draft` and
// `spec_preview_password_hash`, and today it asks as `anon` — a key that is
// public by design, since it ships inside the widget bundle on every customer's
// site. Anyone holding it can therefore list every tenant's site_configs row
// and read unpublished drafts directly from PostgREST. The fix is to read these
// as the service role and then revoke the anon column grant; this half is safe
// to ship first because it changes nothing until the key is present.
let supabaseClient: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!supabaseClient) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      serviceKey
        ? { auth: { persistSession: false, autoRefreshToken: false } }
        : undefined
    );
  }
  return supabaseClient;
}

/** True once the renderer is reading with the service role. */
export function rendererUsesServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

async function loadActiveConfig(hostname: string): Promise<BrandConfig | null> {
  // If we're hitting localhost:3000 directly without a subdomain, fallback to lumina
  // This is helpful for local development if the developer doesn't change their hosts file
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
    hostname = 'lumina.localhost';
  }

  // Query Supabase
  const { data, error } = await getSupabase()
    .from('domains')
    .select(`
      hostname,
      tenants (
        id,
        widget_id,
        site_status,
        temp_preview_expires_at,
        validation_status,
        site_configs (
          brand_name,
          industry,
          theme,
          layout_style,
          default_room,
          hero_config,
          about_config,
          process_config,
          products_config,
          seo_config,
          before_after_config,
          nav_links,
          pages_config,
          logo_url,
          pricing_notes,
          launch_pay_url,
          spec_preview_password_hash,
          design_variant,
          theme_tokens,
          quiz_config,
          engagement_model,
          render_mode,
          edit_in_place,
          edit_in_place_started_at,
          analytics_config,
          custom_config,
          custom_config_draft,
          engine_config_draft,
          content_structure,
          content_version
        )
      )
    `)
    .eq('hostname', hostname)
    .single();

  if (error || !data) {
    console.error(`Failed to load config for hostname: ${hostname}`, error);
    return null;
  }

  return mapRowToConfig(data as unknown as SupabaseConfigRow);
}

// Cross-request cache keyed by hostname. Revalidates every 60s so config edits
// (e.g. site approval, theme changes) propagate without a redeploy. Invalidate
// on demand with revalidateTag('site-config').
function getCachedActiveConfig(hostname: string) {
  const cacheHostname = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === ''
    ? 'lumina.localhost'
    : hostname.toLowerCase();
  return unstable_cache(
    () => loadActiveConfig(cacheHostname),
    ['active-config', cacheHostname],
    { revalidate: 60, tags: [`site-config:${cacheHostname}`] }
  )();
}

// Per-request memoization so layout.tsx and page.tsx share a single lookup
// instead of each hitting Supabase independently.
export const getActiveConfig = cache(
  (hostname: string): Promise<BrandConfig | null> => getCachedActiveConfig(hostname)
);
