import { getActiveConfig } from "@/lib/getConfig";
import { notFound } from "next/navigation";
import ClientPage from "./ClientPage";
import LocalSEO from "@/components/LocalSEO";
import PendingApproval from "@/components/PendingApproval";
import { cookies } from "next/headers";

export default async function Page({ params }: { params: Promise<{ hostname: string }> }) {
  const resolvedParams = await params;
  const config = await getActiveConfig(resolvedParams.hostname);

  if (!config) {
    notFound();
  }

  const cookieStore = await cookies();
  const isAdminBypass = cookieStore.get('admin_bypass')?.value === 'true';

  if (config.siteStatus === 'pending_approval' && !isAdminBypass) {
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
      <ClientPage config={config} />
    </>
  );
}
