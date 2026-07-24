import { getActiveConfig } from "@/lib/getConfig";
import { notFound } from "next/navigation";
import ClientPage from "./ClientPage";
import LocalSEO from "@/components/LocalSEO";
import PendingApproval from "@/components/PendingApproval";
import LaunchPaywall from "@/components/LaunchPaywall";
import CustomSiteRenderer from "@/components/CustomSiteRenderer";
import { getCustomPage, isCustomSiteConfig } from "@/lib/customSite";
import { getSiteGate } from "@/lib/siteGate";
import {
  buildCustomDraftPreviewQuery,
  shouldPaintCustomDraft,
} from "@/lib/customDraftPreview";
import { cookies } from "next/headers";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ hostname: string }>;
  searchParams?: Promise<{ draft?: string; admin_bypass?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
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

  // Draft preview: admin_bypass + (?draft=1 or draft-preview cookie) paints
  // custom_config_draft without publishing. Live visitors never see the draft.
  const wantDraft = shouldPaintCustomDraft({
    isAdminBypass,
    draftParam: resolvedSearch.draft,
    draftPreviewCookie: cookieStore.get('custom_draft_preview')?.value,
  });
  const draftConfig = wantDraft && isCustomSiteConfig(config.customConfigDraft)
    ? config.customConfigDraft
    : null;
  const liveCustom =
    config.renderMode === 'custom' && isCustomSiteConfig(config.customConfig)
      ? config.customConfig
      : null;
  const activeCustom = draftConfig || liveCustom;
  const customPage = activeCustom ? getCustomPage(activeCustom, '/') : null;
  const previewQuery = draftConfig
    ? buildCustomDraftPreviewQuery({
        adminBypassParam: resolvedSearch.admin_bypass,
      })
    : null;

  if (activeCustom && customPage) {
    return (
      <>
        <LocalSEO
          seo={config.seo}
          brandName={config.brandName}
          url={`https://${resolvedParams.hostname}`}
        />
        <CustomSiteRenderer
          custom={activeCustom}
          page={customPage}
          widgetId={config.widgetId}
          engagementModel={config.engagementModel || 'quote'}
          isDraftPreview={!!draftConfig}
          previewQuery={previewQuery}
        />
      </>
    );
  }

  // No custom page for "/" → fall through to the shared template engine.
  return (
    <>
      <LocalSEO seo={config.seo} brandName={config.brandName} url={`https://${resolvedParams.hostname}`} />
      <ClientPage config={config} hostname={resolvedParams.hostname} />
    </>
  );
}
