import { getActiveConfig } from "@/lib/getConfig";
import { notFound } from "next/navigation";
import LocalSEO from "@/components/LocalSEO";
import PendingApproval from "@/components/PendingApproval";
import LaunchPaywall from "@/components/LaunchPaywall";
import GalleryLightbox from "@/components/GalleryLightbox";
import HeroSection from "@/components/HeroSection";
import { getThemeStyles, getGridClasses, applyVoice, getSectionTokens } from "@/lib/theme";
import { siteSeed, getDesignVariant, heroHeadlineClasses, hashSeed } from "@/lib/designVariants";
import { getSiteGate } from "@/lib/siteGate";
import { cookies } from "next/headers";
import Image from "next/image";

export default async function SubPage({ 
  params 
}: { 
  params: Promise<{ hostname: string, slug: string }> 
}) {
  const resolvedParams = await params;
  const config = await getActiveConfig(resolvedParams.hostname);

  if (!config || !config.pagesConfig) {
    notFound();
  }

  // Mirror the home-page gate: suspended/pending tenants must not expose their
  // sub-pages to the public either.
  const cookieStore = await cookies();
  const isAdminBypass = cookieStore.get('admin_bypass')?.value === 'true';
  const gate = getSiteGate(config, isAdminBypass);

  if (gate === 'blocked') {
    notFound();
  }

  if (gate === 'pending') {
    return (
      <>
        <LocalSEO seo={config.seo} brandName={config.brandName} url={`https://${resolvedParams.hostname}/${resolvedParams.slug}`} />
        <PendingApproval />
      </>
    );
  }

  if (gate === 'launch_locked') {
    const payUrl = config.launchPayUrl;
    if (!payUrl) {
      return (
        <>
          <LocalSEO seo={config.seo} brandName={config.brandName} url={`https://${resolvedParams.hostname}/${resolvedParams.slug}`} />
          <PendingApproval />
        </>
      );
    }
    return (
      <>
        <LocalSEO seo={config.seo} brandName={config.brandName} url={`https://${resolvedParams.hostname}/${resolvedParams.slug}`} />
        <LaunchPaywall brandName={config.brandName} launchPayUrl={payUrl} />
      </>
    );
  }

  const pageData = config.pagesConfig.find(p => p.slug === `/${resolvedParams.slug}` || p.slug === resolvedParams.slug);

  if (!pageData) {
    notFound();
  }

  if (pageData.is_active === false) {
    notFound();
  }

  const theme = applyVoice(getThemeStyles(config.theme, config.themeTokens), config.theme, config.designVariant || config.widgetId || config.brandName, config.themeTokens);
  
  const fontSeed = siteSeed(config);
  const variant = getDesignVariant(fontSeed, config.theme);
  const tokens = getSectionTokens(config.theme, fontSeed, config.themeTokens);
  const heroImage = pageData.hero.backgroundImage || config.hero.backgroundImage;
  
  const ORNAMENTS = ['line', 'dot', 'bar', 'double'] as const;
  const signatureSeed = fontSeed;
  const ornament: (typeof ORNAMENTS)[number] =
    ORNAMENTS[hashSeed(`${signatureSeed}:ornament`) % ORNAMENTS.length];

  return (
    <>
      <LocalSEO 
        seo={{...config.seo, legalName: `${pageData.title} | ${config.seo.legalName}`}} 
        brandName={config.brandName} 
        url={`https://${resolvedParams.hostname}/${resolvedParams.slug}`} 
      />
      
      <main className="bg-neutral-900 min-h-screen text-white">
        <HeroSection
          variant={variant}
          theme={theme}
          tokens={tokens}
          headline={pageData.hero.headline}
          heroImage={heroImage}
          brandName={config.brandName}
          heroHeadlineClasses={heroHeadlineClasses(variant.typeScale)}
          ornament={ornament}
        />


        {/* Content Blocks */}
        <section className={`py-24 px-6 mx-auto max-w-screen-xl flex flex-col gap-24`}>
          {pageData.content_blocks.map((block, idx) => {
            if (block.type === 'text') {
              return (
                <div key={idx} className="max-w-4xl mx-auto text-center">
                  {block.heading ? (
                    <h2 className={`text-3xl md:text-4xl ${theme.headingFont} mb-8 ${theme.accentColor}`}>{block.heading}</h2>
                  ) : null}
                  <p className={`text-lg md:text-xl leading-relaxed text-neutral-300 whitespace-pre-line`}>{block.body}</p>
                </div>
              );
            }
            
            if (block.type === 'image_left' || block.type === 'image_right') {
              const isLeft = block.type === 'image_left';
              return (
                <div key={idx} className={`flex flex-col md:flex-row gap-12 items-center ${isLeft ? '' : 'md:flex-row-reverse'}`}>
                  {block.image && (
                    <div className="w-full md:w-1/2 aspect-square md:aspect-[4/3] relative overflow-hidden rounded-xl border border-white/10">
                      <Image src={block.image || 'https://images.unsplash.com/photo-1595428774223-ef52624120d2'} alt={block.heading || 'Section image'} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                    </div>
                  )}
                  <div className={`w-full ${block.image ? 'md:w-1/2' : ''}`}>
                    {block.heading ? (
                      <h2 className={`text-3xl md:text-4xl ${theme.headingFont} mb-6 ${theme.accentColor}`}>{block.heading}</h2>
                    ) : null}
                    <p className={`text-lg leading-relaxed text-neutral-300 whitespace-pre-line`}>{block.body}</p>
                  </div>
                </div>
              );
            }

            if (block.type === 'gallery' && block.images && block.images.length > 0) {
              return (
                <div key={idx} className="w-full">
                  <h2 className={`text-3xl md:text-4xl ${theme.headingFont} mb-6 text-center ${theme.accentColor}`}>
                    {block.heading}
                  </h2>
                  {block.body ? (
                    <p className="text-center text-neutral-300 mb-12 max-w-3xl mx-auto">{block.body}</p>
                  ) : null}
                  <GalleryLightbox images={block.images} altPrefix={`${pageData.title} project`} />
                </div>
              );
            }

            if (block.type === 'grid' && block.items) {
              return (
                <div key={idx} className="w-full">
                  <h2 className={`text-3xl md:text-4xl ${theme.headingFont} mb-12 text-center ${theme.accentColor}`}>{block.heading}</h2>
                  <p className="text-center text-neutral-300 mb-12 max-w-3xl mx-auto">{block.body}</p>
                  <div className={getGridClasses(block.items.length)}>
                    {block.items.map((item, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 overflow-hidden rounded-xl hover:bg-white/10 transition-colors">
                        {item.image ? (
                          <div className="relative aspect-[4/3] w-full">
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover"
                            />
                          </div>
                        ) : null}
                        <div className="p-8">
                          <h3 className={`text-xl font-bold mb-4 text-white`}>{item.title}</h3>
                          <p className="text-neutral-400 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </section>

        {/* Contact details — always shown on the contact page so prospects can
            reach the business even when the AI copy omits them. */}
        {resolvedParams.slug === 'contact' && (
          <section className="pb-24 px-6 mx-auto max-w-3xl">
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 md:p-12 text-center">
              <h2 className={`text-2xl md:text-3xl ${theme.headingFont} mb-8 ${theme.accentColor}`}>Get In Touch</h2>
              <div className="flex flex-col gap-4 text-lg text-neutral-200">
                {config.seo.phone && (
                  <a href={`tel:${config.seo.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-white transition-colors">
                    <span className="text-neutral-400">Phone:</span> {config.seo.phone}
                  </a>
                )}
                {config.seo.email && (
                  <a href={`mailto:${config.seo.email}`} className="hover:text-white transition-colors break-words">
                    <span className="text-neutral-400">Email:</span> {config.seo.email}
                  </a>
                )}
                {config.seo.streetAddress && (
                  <p className="text-neutral-300">
                    <span className="text-neutral-400">Address:</span>{' '}
                    {[config.seo.streetAddress, config.seo.addressLocality, config.seo.addressRegion, config.seo.postalCode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
