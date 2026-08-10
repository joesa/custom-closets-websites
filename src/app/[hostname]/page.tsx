import { getActiveConfig } from "@/lib/getConfig";
import { notFound } from "next/navigation";
import ClientPage from "./ClientPage";
import LocalSEO from "@/components/LocalSEO";
import PendingApproval from "@/components/PendingApproval";
import LaunchPaywall from "@/components/LaunchPaywall";
import CustomSiteRenderer from "@/components/CustomSiteRenderer";
import DraftEmptyNotice from "@/components/DraftEmptyNotice";
import { getCustomPage, isCustomSiteConfig } from "@/lib/customSite";
import { cloakCustomSiteConfig } from "@/lib/mediaProxy";
import { getSiteGate } from "@/lib/siteGate";
import {
  buildCustomDraftPreviewQuery,
  shouldPaintCustomDraft,
} from "@/lib/customDraftPreview";
import { isAdminBypassRequest } from "@/lib/adminBypass";
import { cookies } from "next/headers";
import { PUBLIC_API_URL } from "@/lib/urls";
import { applyEngineDraftPreview } from "@/lib/engineDraftPreview";
import type { Metadata } from "next";
import { verifyContentEditorToken } from "@/lib/contentEditorToken";
import { verifySpecPreviewToken } from "@/lib/specPreviewToken";
import SpecPreviewGate from "@/components/SpecPreviewGate";

// Custom-mode sites carry per-page titles/descriptions in custom_config;
// surface them instead of the engine's brandName-only metadata.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ hostname: string }>;
}): Promise<Metadata> {
  const { hostname } = await params;
  const config = await getActiveConfig(hostname);
  // A gated site is either mid-build or a spec site the business has not agreed
  // to. Neither should be indexed: a forwarded preview link must not put a
  // company's name on a search result for a site they never asked for, and one
  // they may never accept.
  const gatedMeta: Metadata =
    config && config.siteStatus !== 'active'
      ? { robots: { index: false, follow: false } }
      : {};
  if (!config || config.renderMode !== "custom" || !isCustomSiteConfig(config.customConfig)) {
    return gatedMeta;
  }
  const page = getCustomPage(config.customConfig, "/");
  if (!page) return gatedMeta;
  const meta: Metadata = { ...gatedMeta };
  if (page.title?.trim()) meta.title = page.title.trim();
  if (page.description?.trim()) meta.description = page.description.trim().slice(0, 160);
  return meta;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ hostname: string }>;
  searchParams?: Promise<{
    draft?: string;
    admin_bypass?: string;
    edit_token?: string;
    content_editor_token?: string;
    spec_preview_token?: string;
    preview_error?: string;
  }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const config = await getActiveConfig(resolvedParams.hostname);

  if (!config) {
    notFound();
  }

  const cookieStore = await cookies();
  const isAdminBypass = isAdminBypassRequest({
    cookieValue: cookieStore.get('admin_bypass')?.value,
    queryValue: resolvedSearch.admin_bypass,
    secret: process.env.ADMIN_BYPASS_SECRET,
  });
  const isContentEditor = verifyContentEditorToken(resolvedSearch.content_editor_token, config.tenantId);
  // A spec preview: the one business we built this for, looking at it before
  // deciding. Tenant-scoped and expiring, unlike admin_bypass.
  const isSpecPreview = verifySpecPreviewToken(
    resolvedSearch.spec_preview_token ?? cookieStore.get('spec_preview_token')?.value,
    config.tenantId
  );
  const gate = getSiteGate(config, isAdminBypass || isContentEditor || isSpecPreview);

  // Suspended sites are taken offline entirely.
  if (gate === 'blocked') {
    notFound();
  }

  // A spec site with a password set is being pitched to a business that has not
  // agreed to it. Show the password screen rather than the generic
  // under-construction page: the recipient was sent here deliberately and needs
  // to know what they are looking at and that only they can see it.
  if (gate === 'pending' && config.specPreviewPasswordHash) {
    return (
      <SpecPreviewGate
        businessName={config.brandName}
        nextPath={'/'}
        error={resolvedSearch.preview_error === '1'}
      />
    );
  }

  if (gate === 'pending' || gate === 'edit_locked') {
    return (
      <>
        <LocalSEO seo={config.seo} brandName={config.brandName} industry={config.industry} url={`https://${resolvedParams.hostname}`} />
        <PendingApproval reason={gate === 'edit_locked' ? 'edit_locked' : 'pending'} />
      </>
    );
  }

  if (gate === 'launch_locked') {
    const payUrl = config.launchPayUrl;
    if (!payUrl) {
      return (
        <>
          <LocalSEO seo={config.seo} brandName={config.brandName} industry={config.industry} url={`https://${resolvedParams.hostname}`} />
          <PendingApproval />
        </>
      );
    }
    return (
      <>
        <LocalSEO seo={config.seo} brandName={config.brandName} industry={config.industry} url={`https://${resolvedParams.hostname}`} />
        <LaunchPaywall brandName={config.brandName} launchPayUrl={payUrl} />
      </>
    );
  }

  // Draft preview: admin_bypass + ?draft=1 paints custom_config_draft.
  // Live / Visit-site URLs without draft=1 always show published HTML.
  const wantDraft = shouldPaintCustomDraft({
    isAdminBypass,
    draftParam: resolvedSearch.draft,
  });
  const enginePreviewQuery = wantDraft
    ? buildCustomDraftPreviewQuery({ adminBypassParam: resolvedSearch.admin_bypass })
    : undefined;
  const renderConfig = applyEngineDraftPreview(config, {
    enabled: wantDraft,
    previewQuery: enginePreviewQuery,
  });
  const draftConfig = wantDraft && isCustomSiteConfig(config.customConfigDraft)
    ? config.customConfigDraft
    : null;
  const liveCustom =
    config.renderMode === 'custom' && isCustomSiteConfig(config.customConfig)
      ? config.customConfig
      : null;
  const activeCustomRaw = draftConfig || liveCustom;
  // Cloak Supabase storage URLs at render time so page HTML never exposes
  // the raw bucket path (served via encrypted /api/a/<token> proxy).
  const activeCustom = activeCustomRaw
    ? cloakCustomSiteConfig(activeCustomRaw)
    : null;
  const customPage = activeCustom ? getCustomPage(activeCustom, '/') : null;
  const previewQuery = draftConfig
    ? buildCustomDraftPreviewQuery({
        adminBypassParam: resolvedSearch.admin_bypass,
      })
    : null;

  // Empty Full redesign draft (`pages: {}`) used to fall through to the old
  // live/engine site — Preview looked unchanged while admin showed a "success" reply.
  if (draftConfig && !getCustomPage(draftConfig, '/')) {
    return (
      <>
        <LocalSEO seo={config.seo} brandName={config.brandName} industry={config.industry} url={`https://${resolvedParams.hostname}`} />
        <DraftEmptyNotice brandName={config.brandName} />
      </>
    );
  }

  if (activeCustom && customPage) {
    return (
      <>
        <LocalSEO
          seo={config.seo}
          brandName={config.brandName}
          industry={config.industry}
          url={`https://${resolvedParams.hostname}`}
        />
        <CustomSiteRenderer
          custom={activeCustom}
          page={customPage}
          widgetId={config.widgetId}
          engagementModel={config.engagementModel || 'quote'}
          isDraftPreview={!!draftConfig}
          previewQuery={previewQuery}
          editInPlace={Boolean(config.editInPlace) && isAdminBypass}
          tenantId={config.tenantId || config.widgetId}
          pagePath="/"
          apiBaseUrl={PUBLIC_API_URL}
          editToken={
            typeof resolvedSearch.edit_token === 'string'
              ? resolvedSearch.edit_token
              : null
          }
        />
      </>
    );
  }

  // No custom page for "/" → fall through to the shared template engine.
  return (
    <>
      <LocalSEO seo={config.seo} brandName={config.brandName} industry={config.industry} url={`https://${resolvedParams.hostname}`} />
      <ClientPage config={renderConfig} hostname={resolvedParams.hostname} />
    </>
  );
}
