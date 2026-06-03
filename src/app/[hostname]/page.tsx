import { getActiveConfig } from "@/lib/getConfig";
import { notFound } from "next/navigation";
import ClientPage from "./ClientPage";
import LocalSEO from "@/components/LocalSEO";
import PendingApproval from "@/components/PendingApproval";
import LaunchPaywall from "@/components/LaunchPaywall";
import { getSiteGate } from "@/lib/siteGate";
import { cookies } from "next/headers";

export default async function Page({ params }: { params: Promise<{ hostname: string }> }) {
  const resolvedParams = await params;
  const config = await getActiveConfig(resolvedParams.hostname);

  if (!config) {
    notFound();
  }

  const cookieStore = await cookies();
  const isAdminBypass = cookieStore.get('admin_bypass')?.value === 'true';
  const gate = getSiteGate(config, isAdminBypass);

  // Suspended sites are taken offline entirely.
  if (gate === 'blocked') {
    notFound();
  }

  if (gate === 'pending') {
    return (
      <>
        <LocalSEO seo={config.seo} brandName={config.brandName} url={`https://${resolvedParams.hostname}`} />
        <PendingApproval />
      </>
    );
  }

  if (gate === 'launch_locked') {
    const payUrl = config.launchPayUrl;
    if (!payUrl) {
      return (
        <>
          <LocalSEO seo={config.seo} brandName={config.brandName} url={`https://${resolvedParams.hostname}`} />
          <PendingApproval />
        </>
      );
    }
    return (
      <>
        <LocalSEO seo={config.seo} brandName={config.brandName} url={`https://${resolvedParams.hostname}`} />
        <LaunchPaywall brandName={config.brandName} launchPayUrl={payUrl} />
      </>
    );
  }

  return (
    <>
      <LocalSEO seo={config.seo} brandName={config.brandName} url={`https://${resolvedParams.hostname}`} />
      <ClientPage config={config} />
    </>
  );
}
