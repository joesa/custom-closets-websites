import React from 'react';
import Link from 'next/link';
import type { ThemeType, SEOConfig, NavLink } from '@/types/config';
import { getThemeStyles, getSectionTokens, applyVoice, ThemeTokenSelection } from '@/lib/theme';
import { hashSeed } from '@/lib/designVariants';

interface SiteFooterProps {
  brandName: string;
  theme: ThemeType;
  themeTokens?: ThemeTokenSelection | null;
  fontSeed: string;
  seo?: SEOConfig | null;
  navLinks?: NavLink[] | null;
  serviceArea?: string | null;
  licenseNumber?: string | null;
}

type FooterComposition = 'inline' | 'columns' | 'centered' | 'wordmark';

const COMPOSITIONS: FooterComposition[] = ['inline', 'columns', 'centered', 'wordmark'];

export default function SiteFooter({
  brandName,
  theme,
  themeTokens,
  fontSeed,
  seo,
  navLinks,
  serviceArea,
  licenseNumber,
}: SiteFooterProps) {
  const t = applyVoice(getThemeStyles(theme, themeTokens), theme, fontSeed, themeTokens);
  const section = getSectionTokens(theme, fontSeed, themeTokens);
  const composition = COMPOSITIONS[hashSeed(`${fontSeed}:footer-composition`) % COMPOSITIONS.length];

  const hairline = section.isDark ? 'border-white/10' : 'border-black/10';
  const muted = `${t.bodyFont} ${t.textSecondary} text-sm leading-relaxed`;
  const faint = `${t.bodyFont} ${t.textSecondary} text-xs`;

  const streetAddress = seo?.streetAddress?.trim() || '';
  const localityParts = [seo?.addressLocality?.trim(), seo?.addressRegion?.trim()].filter(Boolean).join(', ');
  const localityLine = [localityParts, seo?.postalCode?.trim()].filter(Boolean).join(' ');
  const phone = seo?.phone?.trim() || '';
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : '';
  const hours = seo?.openingHours?.trim() || '';
  const resolvedServiceArea = serviceArea?.trim() || seo?.serviceArea?.trim() || '';
  const resolvedLicenseNumber = licenseNumber?.trim() || seo?.licenseNumber?.trim() || '';
  const servingLine = resolvedServiceArea ? `Serving ${resolvedServiceArea}` : '';
  const licenseLine = resolvedLicenseNumber ? `License #${resolvedLicenseNumber}` : '';
  const copyrightLine = `\u00A9 ${new Date().getFullYear()} ${brandName}`;

  const renderHoursLine = (className?: string) =>
    hours ? <p className={className ?? muted}>{hours}</p> : null;

  const links = (navLinks ?? []).filter(
    (link) =>
      typeof link?.slug === 'string' &&
      link.slug.length > 0 &&
      !link.slug.includes('#quote') &&
      link.slug !== '/quote'
  );

  const renderPhoneLink = (className?: string) =>
    phone ? (
      <a href={telHref} className={`hover:opacity-100 transition-opacity ${className ?? muted}`}>
        {phone}
      </a>
    ) : null;

  const renderAddressBlock = (centered = false) =>
    streetAddress || localityLine ? (
      <address className={`not-italic ${muted} ${centered ? 'text-center' : ''}`}>
        {streetAddress && <span className="block">{streetAddress}</span>}
        {localityLine && <span className="block">{localityLine}</span>}
      </address>
    ) : null;

  const renderFooterNav = (className?: string, linkClassName?: string) =>
    links.length > 0 ? (
      <nav aria-label="Footer" className={className}>
        {links.map((link, i) => (
          <Link
            key={i}
            href={link.slug}
            className={`${t.bodyFont} ${t.textSecondary} text-sm hover:underline underline-offset-4 ${linkClassName ?? ''}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    ) : null;

  const renderSmallPrint = (centered = false) => (
    <div className={`flex flex-wrap gap-x-4 gap-y-1 ${centered ? 'justify-center' : ''}`}>
      {licenseLine && <span className={faint}>{licenseLine}</span>}
      <span className={faint}>{copyrightLine}</span>
    </div>
  );

  let body: React.ReactNode;

  if (composition === 'inline') {
    // Single row: brand left, NAP right, small print underneath.
    body = (
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div>
            <p className={`${t.headingFont} ${t.textPrimary} text-lg`}>{brandName}</p>
            {servingLine && <p className={`${muted} mt-2`}>{servingLine}</p>}
          </div>
          <div className="md:text-right space-y-1">
            {renderAddressBlock()}
            {renderPhoneLink()}
            {renderHoursLine(`${muted} md:text-right`)}
          </div>
        </div>
        {renderFooterNav('mt-8 flex flex-wrap gap-x-6 gap-y-2')}
        <div className={`mt-10 pt-6 border-t ${hairline}`}>
          {renderSmallPrint()}
        </div>
      </div>
    );
  } else if (composition === 'columns') {
    // Three columns: brand / contact / nav.
    body = (
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <p className={`${t.headingFont} ${t.textPrimary} text-lg`}>{brandName}</p>
            {servingLine && <p className={`${muted} mt-3`}>{servingLine}</p>}
            {licenseLine && <p className={`${muted} mt-1`}>{licenseLine}</p>}
          </div>
          <div className="space-y-1">
            {renderAddressBlock()}
            {renderPhoneLink()}
            {renderHoursLine()}
          </div>
          {renderFooterNav('flex flex-col gap-2 md:items-end')}
        </div>
        <div className={`mt-12 pt-6 border-t ${hairline}`}>
          <span className={faint}>{copyrightLine}</span>
        </div>
      </div>
    );
  } else if (composition === 'centered') {
    // Centered stack with a short accent rule on top.
    body = (
      <div className="max-w-2xl mx-auto text-center">
        <div className={`w-10 h-px mx-auto mb-8 ${section.accentBg}`} />
        <p className={`${t.headingFont} ${t.textPrimary} text-xl`}>{brandName}</p>
        <div className="mt-4 space-y-1">
          {renderAddressBlock(true)}
          {renderPhoneLink()}
          {renderHoursLine(`${muted} text-center`)}
        </div>
        {servingLine && <p className={`${muted} mt-3`}>{servingLine}</p>}
        {renderFooterNav('mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2')}
        <div className="mt-10">
          {renderSmallPrint(true)}
        </div>
      </div>
    );
  } else {
    // Big brand wordmark with small print underneath.
    body = (
      <div className="max-w-6xl mx-auto">
        <p className={`${t.headingFont} ${t.textPrimary} text-4xl md:text-6xl`}>
          {brandName}
        </p>
        <div className="mt-8 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="space-y-1">
            {renderAddressBlock()}
            {renderPhoneLink()}
            {renderHoursLine()}
            {servingLine && <p className={muted}>{servingLine}</p>}
          </div>
          {renderFooterNav('flex flex-wrap gap-x-6 gap-y-2')}
        </div>
        <div className={`mt-10 pt-6 border-t ${hairline}`}>
          {renderSmallPrint()}
        </div>
      </div>
    );
  }

  return (
    <footer className={`${t.pageBackground} border-t ${hairline} py-16 px-6`}>
      {body}
    </footer>
  );
}
