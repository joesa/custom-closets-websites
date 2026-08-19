import Script from 'next/script';

/**
 * Per-tenant analytics tags.
 *
 * Contractors could see the leads their site produced but not the visitors it
 * failed to convert, which is the number that decides whether to spend on ads
 * or on the page. A rented website with no analytics is a reason to leave.
 *
 * Only the two identifiers are stored, never a snippet: accepting arbitrary
 * script from a config row would let anyone who can edit a tenant's settings
 * run code on that tenant's domain. Both values are validated against their
 * documented shape before rendering, so a malformed one is dropped rather than
 * interpolated.
 */

export type AnalyticsConfig = { ga4?: string | null; plausible?: string | null };

/** GA4 measurement ids look like G-XXXXXXXXXX. */
const GA4_PATTERN = /^G-[A-Z0-9]{4,20}$/i;
/** Plausible is keyed by the site's domain. */
const DOMAIN_PATTERN = /^[a-z0-9.-]{3,253}$/i;

export function readAnalyticsConfig(raw: unknown): AnalyticsConfig {
  if (!raw || typeof raw !== 'object') return {};
  const record = raw as Record<string, unknown>;
  const ga4 = typeof record.ga4 === 'string' ? record.ga4.trim() : '';
  const plausible = typeof record.plausible === 'string' ? record.plausible.trim() : '';
  return {
    ga4: GA4_PATTERN.test(ga4) ? ga4 : null,
    plausible: DOMAIN_PATTERN.test(plausible) ? plausible : null,
  };
}

export default function TenantAnalytics({ config }: { config: unknown }) {
  const { ga4, plausible } = readAnalyticsConfig(config);
  if (!ga4 && !plausible) return null;

  return (
    <>
      {ga4 && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4)}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(ga4)});`}
          </Script>
        </>
      )}
      {plausible && (
        <Script
          defer
          data-domain={plausible}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      )}
    </>
  );
}
