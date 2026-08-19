import { getActiveConfig } from "@/lib/getConfig";
import Navbar from "@/components/Navbar";
import ContentEditorShell from "@/components/ContentEditorShell";
import { getDesignVariant, siteSeed } from "@/lib/designVariants";
import { getThemeStyles, getSectionTokens, applyVoice, generateCssVars, cssVarsToString } from '@/lib/theme';
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { resolveImageArtDirection } from '@/lib/imageArtDirection';
import TenantAnalytics from "@/components/TenantAnalytics";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hostname: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const config = await getActiveConfig(resolvedParams.hostname);
  if (!config) {
    return { title: "DitchTheForm" };
  }
  // Last-resort description is derived from real config (industry + locality),
  // never a fleet-wide closet-specific literal.
  const industry = config.industry?.trim();
  const locality = config.seo?.addressLocality?.trim();
  const derived = [
    industry ? `${industry} by ${config.brandName}` : config.brandName,
    locality ? `serving ${locality}` : null,
  ]
    .filter(Boolean)
    .join(', ');
  const description =
    config.hero.subheadline?.trim() ||
    config.about.description?.trim() ||
    `${derived}.`;
  const title = locality ? `${config.brandName} | ${locality}` : config.brandName;
  const url = `https://${resolvedParams.hostname}`;
  // The hero is the one image every tenant has, and it is the image a human
  // would expect to see when the link is shared.
  const shareImage = config.hero?.backgroundImage?.trim() || undefined;
  const summary = description.slice(0, 160);

  return {
    metadataBase: new URL(url),
    title,
    description: summary,
    // Sharing a link to your own business and getting a bare grey rectangle is
    // the most visible omission on a product sold as a marketing site. None of
    // this existed: no Open Graph, no Twitter card, no canonical.
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: config.brandName,
      title,
      description: summary,
      url,
      ...(shareImage ? { images: [{ url: shareImage, alt: config.brandName }] } : {}),
    },
    twitter: {
      card: shareImage ? 'summary_large_image' : 'summary',
      title,
      description: summary,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
  };
}

export default async function HostnameLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ hostname: string }>;
}) {
  const resolvedParams = await params;
  const config = await getActiveConfig(resolvedParams.hostname);

  if (!config) {
    return <>{children}</>;
  }

  // Rendered on every path below, including custom mode, which returns early.
  const analytics = <TenantAnalytics config={config.analyticsConfig} />;

  const cookieStore = await cookies();
  const draftPreview = cookieStore.get('custom_draft_preview')?.value === 'true';

  // Custom-mode sites (and draft custom previews) own their own chrome.
  // Skip the engine Navbar so it doesn't double-render over the custom build.
  if (config.renderMode === 'custom' || draftPreview) {
    return (
      <>
        {analytics}
        {children}
      </>
    );
  }

  // If there are navLinks, it's a multi-page site.
  // We render the Navbar and pass the theme to it.
  const hasNav = config.navLinks && config.navLinks.length > 0;
  
  // Generate elevated design system CSS custom properties
  const fontSeed = siteSeed(config);
  const themeStyles = applyVoice(getThemeStyles(config.theme, config.themeTokens), config.theme, fontSeed, config.themeTokens);
  const sectionTokens = getSectionTokens(config.theme, fontSeed, config.themeTokens);
  const cssVars = generateCssVars(themeStyles, sectionTokens, config.theme);
  const cssVarString = `:root {\n${cssVarsToString(cssVars)}\n}`;

  const navStyle = getDesignVariant(fontSeed, config.theme).nav;
  const designVariant = getDesignVariant(fontSeed, config.theme);
  const imageArt = resolveImageArtDirection(config.theme, fontSeed);
  const isSidebarNav = hasNav && navStyle.startsWith('sidebar-left');

  return (
    <ContentEditorShell engineDocument={{
      brand_name: config.brandName,
      hero_config: config.hero,
      about_config: config.about,
      process_config: config.process,
      products_config: config.products,
      seo_config: config.seo,
      before_after_config: config.beforeAfter,
      quiz_config: config.quiz,
      nav_links: config.navLinks,
      pages_config: config.pagesConfig,
      logo_url: config.logoUrl,
      pricing_notes: config.pricingNotes,
      content_structure: config.contentStructure,
    }}>
      {analytics}
      <style dangerouslySetInnerHTML={{ __html: cssVarString }} />
      <div
        data-engine-site="v2"
        data-type-scale={designVariant.typeScale}
        data-image-art={imageArt}
        data-focus-standard="visible-ring"
        data-performance-standard="reserved-media-next-font"
      >
        {hasNav && (
          <Navbar
            brandName={config.brandName}
            links={config.navLinks || []}
            themeName={config.theme}
            themeTokens={config.themeTokens}
            logoUrl={config.logoUrl}
            fontSeed={fontSeed}
            navStyle={navStyle}
            phone={config.seo?.phone}
            engagementModel={config.engagementModel}
          />
        )}
        {/* Fixed sidebar-left nav is w-64; offset main content so pages aren't cramped. */}
        <div className={isSidebarNav ? 'md:pl-64' : undefined}>{children}</div>
      </div>
    </ContentEditorShell>
  );
}
