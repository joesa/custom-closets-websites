import { getActiveConfig } from "@/lib/getConfig";
import Navbar from "@/components/Navbar";
import { getDesignVariant, siteSeed } from "@/lib/designVariants";
import { cookies } from "next/headers";
import type { Metadata } from "next";

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
  const description =
    config.hero.subheadline?.trim() ||
    config.about.description?.trim() ||
    `${config.brandName} — custom storage and instant quotes.`;
  return {
    title: config.brandName,
    description: description.slice(0, 160),
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

  const cookieStore = await cookies();
  const draftPreview = cookieStore.get('custom_draft_preview')?.value === 'true';

  // Custom-mode sites (and draft custom previews) own their own chrome.
  // Skip the engine Navbar so it doesn't double-render over the custom build.
  if (config.renderMode === 'custom' || draftPreview) {
    return <>{children}</>;
  }

  // If there are navLinks, it's a multi-page site.
  // We render the Navbar and pass the theme to it.
  const hasNav = config.navLinks && config.navLinks.length > 0;
  const fontSeed = siteSeed(config);
  const navStyle = getDesignVariant(fontSeed, config.theme).nav;
  const isSidebarNav = hasNav && navStyle.startsWith('sidebar-left');

  return (
    <>
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
    </>
  );
}
