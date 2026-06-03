import type { BrandConfig } from '@/types/config';

export type SiteGate = 'ok' | 'pending' | 'launch_locked' | 'blocked';

/**
 * Decide whether a tenant site is publicly viewable based on its site_status.
 *
 *  - 'pending_approval'         -> under-construction holding page
 *  - 'awaiting_launch_payment'  -> paywall (preview approved, launch not paid)
 *  - 'suspended'                -> blocked entirely (404)
 *  - 'active'                   -> full site
 *
 * A valid admin_bypass cookie always renders the live site so operators can
 * preview pending/suspended tenants.
 */
export function getSiteGate(config: BrandConfig, isAdminBypass: boolean): SiteGate {
  if (isAdminBypass) return 'ok';
  switch (config.siteStatus) {
    case 'pending_approval':
      return 'pending';
    case 'awaiting_launch_payment':
      return 'launch_locked';
    case 'suspended':
      return 'blocked';
    default:
      return 'ok';
  }
}
