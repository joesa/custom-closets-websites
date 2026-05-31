import { getActiveConfig } from "@/lib/getConfig";
import Navbar from "@/components/Navbar";

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

  return (
    <>
      {hasNav && (
        <Navbar 
          brandName={config.brandName} 
          links={config.navLinks || []} 
          themeName={config.theme} 
          logoUrl={config.logoUrl}
        />
      )}
      {children}
    </>
  );
}
