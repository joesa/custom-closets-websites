import { getActiveConfig } from "@/lib/getConfig";
import { notFound } from "next/navigation";
import LocalSEO from "@/components/LocalSEO";
import PendingApproval from "@/components/PendingApproval";
import LaunchPaywall from "@/components/LaunchPaywall";
import CustomSiteRenderer from "@/components/CustomSiteRenderer";
import DraftEmptyNotice from "@/components/DraftEmptyNotice";
import DraftMissingPageNotice from "@/components/DraftMissingPageNotice";
import GalleryLightbox from "@/components/GalleryLightbox";
import HeroSection from "@/components/HeroSection";
import { getThemeStyles, getGridClasses, applyVoice, getSectionTokens } from "@/lib/theme";
import { siteSeed, getDesignVariant, pageHeroHeadlineClasses } from "@/lib/designVariants";
import { resolveSiteSignature } from "@/lib/siteSignature";
import { resolvePageComposition } from "@/lib/pageCompositions";
import { getCustomPage, isCustomSiteConfig } from "@/lib/customSite";
import { cloakCustomSiteConfig } from "@/lib/mediaProxy";
import { getSiteGate } from "@/lib/siteGate";
import {
  buildCustomDraftPreviewQuery,
  shouldPaintCustomDraft,
} from "@/lib/customDraftPreview";
import { isAdminBypassRequest } from "@/lib/adminBypass";
import { cookies } from "next/headers";
import Image from "next/image";
import ServicesProductGrid from "@/components/ServicesProductGrid";
import { PUBLIC_API_URL } from "@/lib/urls";
import type { Metadata } from "next";
import { applyEngineDraftPreview } from "@/lib/engineDraftPreview";
import { verifyContentEditorToken } from "@/lib/contentEditorToken";

// Custom-mode sites carry per-page titles/descriptions in custom_config;
// surface them instead of the engine's brandName-only metadata.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ hostname: string; slug: string }>;
}): Promise<Metadata> {
  const { hostname, slug } = await params;
  const config = await getActiveConfig(hostname);
  if (!config || config.renderMode !== "custom" || !isCustomSiteConfig(config.customConfig)) {
    return {};
  }
  const page = getCustomPage(config.customConfig, `/${slug}`);
  if (!page) return {};
  const meta: Metadata = {};
  if (page.title?.trim()) meta.title = page.title.trim();
  if (page.description?.trim()) meta.description = page.description.trim().slice(0, 160);
  return meta;
}

export default async function SubPage({
  params,
  searchParams,
}: {
  params: Promise<{ hostname: string; slug: string }>;
  searchParams?: Promise<{ draft?: string; admin_bypass?: string; edit_token?: string; content_editor_token?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const config = await getActiveConfig(resolvedParams.hostname);

  if (!config) {
    notFound();
  }

  const cookieStore = await cookies();
  const isAdminBypass = isAdminBypassRequest({
    cookieValue: cookieStore.get("admin_bypass")?.value,
    queryValue: resolvedSearch.admin_bypass,
    secret: process.env.ADMIN_BYPASS_SECRET,
  });
  const isContentEditor = verifyContentEditorToken(resolvedSearch.content_editor_token, config.tenantId);
  const gate = getSiteGate(config, isAdminBypass || isContentEditor);

  if (gate === "blocked") {
    notFound();
  }

  if (gate === "pending" || gate === "edit_locked") {
    return (
      <>
        <LocalSEO
          seo={config.seo}
          brandName={config.brandName}
          url={`https://${resolvedParams.hostname}/${resolvedParams.slug}`}
        />
        <PendingApproval reason={gate === "edit_locked" ? "edit_locked" : "pending"} />
      </>
    );
  }

  if (gate === "launch_locked") {
    const payUrl = config.launchPayUrl;
    if (!payUrl) {
      return (
        <>
          <LocalSEO
            seo={config.seo}
            brandName={config.brandName}
            url={`https://${resolvedParams.hostname}/${resolvedParams.slug}`}
          />
          <PendingApproval />
        </>
      );
    }
    return (
      <>
        <LocalSEO
          seo={config.seo}
          brandName={config.brandName}
          url={`https://${resolvedParams.hostname}/${resolvedParams.slug}`}
        />
        <LaunchPaywall brandName={config.brandName} launchPayUrl={payUrl} />
      </>
    );
  }

  // Per-page custom render: if this path exists in the custom artifact, paint
  // it outside the template engine. Otherwise fall through to pagesConfig.
  // Draft preview requires explicit ?draft=1 (cookie alone must not stick).
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
  const draftConfig =
    wantDraft && isCustomSiteConfig(config.customConfigDraft)
      ? config.customConfigDraft
      : null;
  const liveCustom =
    config.renderMode === "custom" && isCustomSiteConfig(config.customConfig)
      ? config.customConfig
      : null;
  const activeCustomRaw = draftConfig || liveCustom;
  const activeCustom = activeCustomRaw
    ? cloakCustomSiteConfig(activeCustomRaw)
    : null;
  const customPage = activeCustom
    ? getCustomPage(activeCustom, `/${resolvedParams.slug}`)
    : null;
  const previewQuery = draftConfig
    ? buildCustomDraftPreviewQuery({
        adminBypassParam: resolvedSearch.admin_bypass,
      })
    : null;

  if (
    draftConfig &&
    !getCustomPage(draftConfig, `/${resolvedParams.slug}`) &&
    !getCustomPage(draftConfig, '/')
  ) {
    return (
      <>
        <LocalSEO
          seo={config.seo}
          brandName={config.brandName}
          url={`https://${resolvedParams.hostname}/${resolvedParams.slug}`}
        />
        <DraftEmptyNotice brandName={config.brandName} />
      </>
    );
  }

  // Draft has home but this path is missing/empty — do not fall through to the
  // old engine (looks like "half redesigned").
  if (draftConfig) {
    const draftPage = getCustomPage(draftConfig, `/${resolvedParams.slug}`);
    const html = (draftPage?.html || "").trim();
    if (!draftPage || html.length < 40) {
      const availablePaths = Object.keys(draftConfig.pages || {})
        .filter((k) => (draftConfig.pages[k]?.html || "").trim().length >= 40)
        .sort();
      return (
        <>
          <LocalSEO
            seo={config.seo}
            brandName={config.brandName}
            url={`https://${resolvedParams.hostname}/${resolvedParams.slug}`}
          />
          <DraftMissingPageNotice
            brandName={config.brandName}
            path={`/${resolvedParams.slug}`}
            availablePaths={availablePaths}
          />
        </>
      );
    }
  }

  if (activeCustom && customPage) {
    return (
      <>
        <LocalSEO
          seo={config.seo}
          brandName={config.brandName}
          url={`https://${resolvedParams.hostname}/${resolvedParams.slug}`}
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
          pagePath={`/${resolvedParams.slug}`}
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

  if (!renderConfig.pagesConfig) {
    notFound();
  }

  const pageData = renderConfig.pagesConfig.find(
    (p) => p.slug === `/${resolvedParams.slug}` || p.slug === resolvedParams.slug
  );

  if (!pageData) {
    notFound();
  }

  if (pageData.is_active === false) {
    notFound();
  }

  const theme = applyVoice(
    getThemeStyles(config.theme, config.themeTokens),
    config.theme,
    config.designVariant || config.widgetId || config.brandName,
    config.themeTokens
  );

  const fontSeed = siteSeed(config);
  const variant = getDesignVariant(fontSeed, config.theme);
  const tokens = getSectionTokens(config.theme, fontSeed, config.themeTokens);
  const heroImage = pageData.hero.backgroundImage || config.hero.backgroundImage;
  const heroPresentation = pageData.hero.backgroundImage ? pageData.hero : config.hero;
  const signature = resolveSiteSignature({
    brandName: config.brandName,
    seed: fontSeed,
    signature: config.signature,
  });
  const composition = resolvePageComposition(resolvedParams.slug, fontSeed);
  const pageBg = theme.pageBackground || "bg-stone-50";
  const mutedText =
    pageBg.includes("950") || pageBg.includes("900") || pageBg.includes("[#2") || pageBg.includes("[#1")
      ? "text-neutral-300"
      : "text-neutral-600";
  const cardSurface =
    pageBg.includes("950") || pageBg.includes("900") || pageBg.includes("[#2") || pageBg.includes("[#1")
      ? "bg-white/5 border-white/10"
      : "bg-black/[0.03] border-black/10";

  const textBlocks = pageData.content_blocks.filter((b) => b.type === "text");
  const otherBlocks = pageData.content_blocks.filter((b) => b.type !== "text");

  // Real proof points only — never invent "Licensed & insured" style filler.
  const credentialBullets: string[] = [];
  for (const p of config.products || []) {
    for (const spec of p.details?.specifications || []) {
      const s = (spec || "").trim();
      if (s && !credentialBullets.includes(s) && credentialBullets.length < 6) {
        credentialBullets.push(s);
      }
    }
  }
  if (config.seo.addressLocality) {
    credentialBullets.push(`Serving ${config.seo.addressLocality}`);
  }
  const contactCta =
    config.engagementModel === "order"
      ? "Place an order"
      : config.engagementModel === "booking"
        ? "Book a time"
        : config.engagementModel === "ticket"
          ? "Get tickets"
          : "Get a quote";

  return (
    <>
      <LocalSEO
        seo={{ ...config.seo, legalName: `${pageData.title} | ${config.seo.legalName}` }}
        brandName={config.brandName}
        url={`https://${resolvedParams.hostname}/${resolvedParams.slug}`}
      />

      <main className={`${pageBg} min-h-screen ${theme.textPrimary}`}>
        <HeroSection
          variant={variant}
          theme={theme}
          tokens={tokens}
          headline={pageData.hero.headline}
          heroImage={heroImage}
          heroImageAlt={pageData.hero.backgroundImageAlt || config.hero.backgroundImageAlt}
          imageFit={heroPresentation.imageFit}
          imagePosition={heroPresentation.imagePosition}
          imageScale={heroPresentation.imageScale}
          brandName={config.brandName}
          heroHeadlineClasses={pageHeroHeadlineClasses(variant.typeScale)}
          ornament={signature.motif}
        />

        <section className={composition.shellClass}>
          {composition.family === "services" && (config.products?.length ?? 0) > 0 ? (
            composition.servicesIntroSticky ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                <aside className="lg:col-span-4 lg:sticky lg:top-28 self-start space-y-4">
                  <p className={`text-sm uppercase tracking-[0.2em] ${theme.bodyFont} ${theme.accentColor}`}>
                    {signature.eyebrow}
                  </p>
                  <h2 className={`text-2xl md:text-3xl ${theme.headingFont} ${theme.accentColor}`}>
                    {pageData.title}
                  </h2>
                  {textBlocks[0]?.body ? (
                    <p className={`text-base leading-relaxed ${theme.bodyFont} ${mutedText} whitespace-pre-line`}>
                      {textBlocks[0].body}
                    </p>
                  ) : null}
                </aside>
                <div className="lg:col-span-8">
                  <ServicesProductGrid
                    products={config.products}
                    theme={theme}
                    themeType={config.theme}
                    themeTokens={config.themeTokens}
                    fontSeed={fontSeed}
                    heading="What we offer"
                    mutedText={mutedText}
                    cardSurface={cardSurface}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-12">
                {textBlocks[0] ? (
                  <div className="max-w-3xl">
                    {textBlocks[0].heading ? (
                      <h2
                        className={`text-2xl md:text-3xl leading-tight text-balance ${theme.headingFont} mb-5 ${theme.accentColor}`}
                      >
                        {textBlocks[0].heading}
                      </h2>
                    ) : null}
                    <p
                      className={`text-base md:text-lg leading-relaxed ${theme.bodyFont} ${mutedText} whitespace-pre-line`}
                    >
                      {textBlocks[0].body}
                    </p>
                  </div>
                ) : null}
                <ServicesProductGrid
                  products={config.products}
                  theme={theme}
                  themeType={config.theme}
                  themeTokens={config.themeTokens}
                  fontSeed={fontSeed}
                  heading="What we offer"
                  mutedText={mutedText}
                  cardSurface={cardSurface}
                />
              </div>
            )
          ) : composition.family === "services" && composition.servicesIntroSticky ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
              <aside className="lg:col-span-4 lg:sticky lg:top-28 self-start space-y-4">
                <p className={`text-sm uppercase tracking-[0.2em] ${theme.bodyFont} ${theme.accentColor}`}>
                  {signature.eyebrow}
                </p>
                <h2 className={`text-2xl md:text-3xl ${theme.headingFont} ${theme.accentColor}`}>
                  {pageData.title}
                </h2>
                {textBlocks[0]?.body ? (
                  <p className={`text-base leading-relaxed ${theme.bodyFont} ${mutedText} whitespace-pre-line`}>
                    {textBlocks[0].body}
                  </p>
                ) : null}
              </aside>
              <div className="lg:col-span-8 flex flex-col gap-16">
                {[...textBlocks.slice(1), ...otherBlocks].map((block, idx) =>
                  renderBlock(block, idx, {
                    theme,
                    mutedText,
                    cardSurface,
                    pageDataTitle: pageData.title,
                    composition,
                  })
                )}
              </div>
            </div>
          ) : composition.family === "about" && composition.aboutSplit ? (
            <div className="flex flex-col gap-16 md:gap-20">
              <div
                className={
                  credentialBullets.length > 0
                    ? "grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-start"
                    : "flex flex-col gap-12 max-w-3xl"
                }
              >
                <div className={credentialBullets.length > 0 ? "md:col-span-7 space-y-10" : "space-y-10"}>
                  <p className={`text-sm ${theme.bodyFont} ${theme.accentColor}`}>{signature.eyebrow}</p>
                  {textBlocks.map((block, idx) => (
                    <div key={`about-text-${idx}`}>
                      {block.heading ? (
                        <h2
                          className={`text-2xl md:text-4xl leading-tight text-balance ${theme.headingFont} mb-5 ${theme.accentColor}`}
                        >
                          {block.heading}
                        </h2>
                      ) : null}
                      <p
                        className={`text-base md:text-lg leading-relaxed ${theme.bodyFont} ${mutedText} whitespace-pre-line`}
                      >
                        {block.body}
                      </p>
                    </div>
                  ))}
                </div>
                {credentialBullets.length > 0 ? (
                  <aside className={`md:col-span-5 space-y-5 p-8 border ${cardSurface}`}>
                    <h3 className={`text-lg md:text-xl ${theme.headingFont} ${theme.accentColor}`}>
                      At a glance
                    </h3>
                    <ul className={`space-y-3 text-base leading-relaxed ${theme.bodyFont} ${mutedText}`}>
                      {credentialBullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </aside>
                ) : null}
              </div>
              {otherBlocks.length > 0 ? (
                <div className="flex flex-col gap-16 w-full">
                  {otherBlocks.map((block, idx) =>
                    renderBlock(block, idx, {
                      theme,
                      mutedText,
                      cardSurface,
                      pageDataTitle: pageData.title,
                      composition,
                    })
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            pageData.content_blocks.map((block, idx) =>
              renderBlock(block, idx, {
                theme,
                mutedText,
                cardSurface,
                pageDataTitle: pageData.title,
                composition,
              })
            )
          )}
        </section>

        {resolvedParams.slug === "contact" && (
          <section
            className={`pb-24 px-6 mx-auto ${
              composition.contactSplit ? "max-w-screen-xl" : "max-w-3xl"
            }`}
          >
            <div
              className={
                composition.contactSplit
                  ? `grid grid-cols-1 md:grid-cols-2 gap-0 border overflow-hidden ${cardSurface}`
                  : `border rounded-xl p-8 md:p-12 text-center ${cardSurface}`
              }
            >
              <div className={composition.contactSplit ? "p-8 md:p-12" : ""}>
                <h2 className={`text-2xl md:text-3xl ${theme.headingFont} mb-8 ${theme.accentColor}`}>
                  Contact
                </h2>
                <div
                  className={`flex flex-col gap-4 text-lg ${
                    composition.contactSplit ? "text-left" : ""
                  } ${mutedText}`}
                >
                  {config.seo.phone && (
                    <a
                      href={`tel:${config.seo.phone.replace(/[^0-9+]/g, "")}`}
                      className="hover:opacity-80 transition-opacity"
                    >
                      <span className="opacity-60">Phone:</span> {config.seo.phone}
                    </a>
                  )}
                  {config.seo.email && (
                    <a
                      href={`mailto:${config.seo.email}`}
                      className="hover:opacity-80 transition-opacity break-words"
                    >
                      <span className="opacity-60">Email:</span> {config.seo.email}
                    </a>
                  )}
                  {config.seo.streetAddress && (
                    <p>
                      <span className="opacity-60">Address:</span>{" "}
                      {[
                        config.seo.streetAddress,
                        config.seo.addressLocality,
                        config.seo.addressRegion,
                        config.seo.postalCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>
              {composition.contactSplit ? (
                <div
                  className={`p-8 md:p-12 flex flex-col justify-center ${
                    pageBg.includes("950") || pageBg.includes("900")
                      ? "bg-white/5"
                      : "bg-black/[0.04]"
                  }`}
                >
                  <p className={`text-sm mb-4 ${theme.accentColor}`}>{signature.eyebrow}</p>
                  <p className={`text-2xl md:text-3xl ${theme.headingFont} mb-4`}>{contactCta}</p>
                  {config.seo.addressLocality || config.seo.addressRegion ? (
                    <p className={`text-base ${mutedText}`}>
                      Serving{" "}
                      {[config.seo.addressLocality, config.seo.addressRegion]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

type ThemeLike = {
  headingFont: string;
  bodyFont: string;
  accentColor: string;
};

function renderBlock(
  block: {
    type: string;
    heading?: string;
    body?: string;
    image?: string;
    imageAlt?: string;
    imageSize?: "small" | "medium" | "large" | "full";
    imageAspect?: "square" | "landscape" | "wide" | "portrait";
    imageFit?: "cover" | "contain";
    images?: string[];
    items?: Array<{
      title: string;
      description: string;
      image?: string;
      imageAlt?: string;
      imageSize?: "small" | "medium" | "large" | "full";
      imageAspect?: "square" | "landscape" | "wide" | "portrait";
      imageFit?: "cover" | "contain";
    }>;
  },
  idx: number,
  ctx: {
    theme: ThemeLike;
    mutedText: string;
    cardSurface: string;
    pageDataTitle: string;
    composition: ReturnType<typeof resolvePageComposition>;
  }
) {
  const { theme, mutedText, cardSurface, pageDataTitle, composition } = ctx;
  const sizeClasses = { small: "max-w-xs", medium: "max-w-md", large: "max-w-xl", full: "max-w-none" } as const;
  const aspectClasses = { square: "aspect-square", landscape: "aspect-[4/3]", wide: "aspect-video", portrait: "aspect-[3/4]" } as const;

  if (block.type === "text") {
    return (
      <div
        key={idx}
        className={
          composition.family === "about"
            ? "max-w-3xl w-full"
            : "max-w-4xl mx-auto text-center w-full"
        }
      >
        {block.heading ? (
          <h2
            className={`text-2xl md:text-3xl leading-tight text-balance ${theme.headingFont} mb-6 ${theme.accentColor}`}
          >
            {block.heading}
          </h2>
        ) : null}
        <p
          className={`text-base md:text-lg leading-relaxed ${theme.bodyFont} ${mutedText} whitespace-pre-line`}
        >
          {block.body}
        </p>
      </div>
    );
  }

  if (block.type === "image_left" || block.type === "image_right") {
    const isLeft = block.type === "image_left";
    return (
      <div
        key={idx}
        className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center w-full"
      >
        {block.image ? (
          <div
            className={`relative w-full overflow-hidden border border-white/10 mx-auto ${sizeClasses[block.imageSize || "full"]} ${aspectClasses[block.imageAspect || "landscape"]} ${
              isLeft ? "md:order-1" : "md:order-2"
            }`}
          >
            <Image
              src={block.image}
              alt={block.imageAlt || block.heading || "Section image"}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={block.imageFit === "contain" ? "object-contain" : "object-cover"}
            />
          </div>
        ) : null}
        <div className={`w-full min-w-0 ${isLeft ? "md:order-2" : "md:order-1"}`}>
          {block.heading ? (
            <h2
              className={`text-2xl md:text-3xl leading-tight text-balance ${theme.headingFont} mb-5 ${theme.accentColor}`}
            >
              {block.heading}
            </h2>
          ) : null}
          <p
            className={`text-base md:text-lg leading-relaxed ${theme.bodyFont} ${mutedText} whitespace-pre-line`}
          >
            {block.body}
          </p>
        </div>
      </div>
    );
  }

  if (block.type === "gallery" && block.images && block.images.length > 0) {
    return (
      <div key={idx} className={`w-full ${composition.galleryBleed ? "-mx-2 md:mx-0" : ""}`}>
        <h2
          className={`text-2xl md:text-3xl leading-tight text-balance ${theme.headingFont} mb-6 ${
            composition.galleryBleed ? "text-left px-2" : "text-center"
          } ${theme.accentColor}`}
        >
          {block.heading}
        </h2>
        {block.body ? (
          <p
            className={`${
              composition.galleryBleed ? "text-left px-2 max-w-2xl" : "text-center max-w-3xl mx-auto"
            } text-base md:text-lg ${theme.bodyFont} ${mutedText} mb-12`}
          >
            {block.body}
          </p>
        ) : null}
        <GalleryLightbox images={block.images} altPrefix={`${pageDataTitle} project`} imageSize={block.imageSize} imageAspect={block.imageAspect} imageFit={block.imageFit} />
      </div>
    );
  }

  if (block.type === "grid" && block.items) {
    return (
      <div key={idx} className="w-full">
        <h2
          className={`text-2xl md:text-3xl leading-tight text-balance ${theme.headingFont} mb-6 ${
            composition.servicesIntroSticky ? "text-left" : "text-center"
          } ${theme.accentColor}`}
        >
          {block.heading}
        </h2>
        {block.body ? (
          <p
            className={`${
              composition.servicesIntroSticky ? "text-left" : "text-center mx-auto"
            } text-base md:text-lg ${theme.bodyFont} ${mutedText} mb-10 max-w-3xl`}
          >
            {block.body}
          </p>
        ) : null}
        <div className={getGridClasses(block.items.length)}>
          {block.items.map((item, i) => (
            <div
              key={i}
              className={`border overflow-hidden transition-colors min-w-0 ${cardSurface}`}
            >
              {item.image ? (
                <div className={`relative w-full mx-auto ${sizeClasses[item.imageSize || "full"]} ${aspectClasses[item.imageAspect || "landscape"]}`}>
                  <Image
                    src={item.image}
                    alt={item.imageAlt || item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={item.imageFit === "contain" ? "object-contain" : "object-cover"}
                  />
                </div>
              ) : null}
              <div className="p-6 md:p-8">
                <h3 className={`text-lg md:text-xl font-bold mb-3 break-words ${theme.headingFont}`}>
                  {item.title}
                </h3>
                <p className={`text-base leading-relaxed break-words ${theme.bodyFont} ${mutedText}`}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
