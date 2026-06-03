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
let supabaseClient: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
  }
  return supabaseClient;
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
          before_after_config,
          nav_links,
          pages_config,
          logo_url,
          pricing_notes,
          launch_pay_url
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
const getCachedActiveConfig = unstable_cache(
  (hostname: string) => loadActiveConfig(hostname),
  ['active-config'],
  { revalidate: 60, tags: ['site-config'] }
);

// Per-request memoization so layout.tsx and page.tsx share a single lookup
// instead of each hitting Supabase independently.
export const getActiveConfig = cache(
  (hostname: string): Promise<BrandConfig | null> => getCachedActiveConfig(hostname)
);
