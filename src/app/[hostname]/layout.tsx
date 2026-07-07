import { getActiveConfig } from "@/lib/getConfig";
import Navbar from "@/components/Navbar";
import { getDesignVariant, siteSeed } from "@/lib/designVariants";

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

  // If there are navLinks, it's a multi-page site.
  // We render the Navbar and pass the theme to it.
  const hasNav = config.navLinks && config.navLinks.length > 0;
  const fontSeed = siteSeed(config);
  const navStyle = getDesignVariant(fontSeed, config.theme).nav;

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
      {children}
    </>
  );
}
