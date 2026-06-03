import React from 'react';

type Props = {
  brandName?: string;
  launchPayUrl: string;
};

/**
 * Shown when preview is approved but launch payment (balance / standard build) is not.
 * Applies on every hostname (platform subdomain and custom domain).
 */
export default function LaunchPaywall({ brandName, launchPayUrl }: Props) {
  const title = brandName ? `${brandName} — almost live` : 'Your site is ready to launch';

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-sans text-white">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-light tracking-tight">{title}</h1>
        <p className="text-neutral-400 leading-relaxed text-sm">
          Your customized site has been built and reviewed. Complete your remaining launch payment to
          make it publicly available on this address.
        </p>
        <a
          href={launchPayUrl}
          className="inline-block w-full rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
        >
          Complete launch payment
        </a>
        <p className="text-xs text-neutral-500">
          You will be redirected to our secure checkout. The link is also in your launch email.
        </p>
      </div>
    </div>
  );
}
