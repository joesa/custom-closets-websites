import type { BrandConfig } from '@/types/config';

export type SiteGate = 'ok' | 'pending' | 'blocked';

/**
 * Decide whether a tenant site is publicly viewable based on its site_status.
 *
 *  - 'pending_approval' -> show the PendingApproval holding page
 *  - 'suspended'        -> blocked entirely (404), e.g. non-payment / abuse
 *  - anything else       -> live
 *
 * A valid admin_bypass cookie always renders the live site so operators can
 * preview pending/suspended tenants.
 */
export function getSiteGate(config: BrandConfig, isAdminBypass: boolean): SiteGate {
  if (isAdminBypass) return 'ok';
  switch (config.siteStatus) {
    case 'pending_approval':
      return 'pending';
    case 'suspended':
      return 'blocked';
    default:
      return 'ok';
  }
}
