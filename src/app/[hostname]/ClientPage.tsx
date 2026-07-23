"use client";

import React, { useState } from "react";
import Image from "next/image";
import Script from "next/script";
import * as motion from "framer-motion/client";
import { getThemeStyles, getGridClasses, getThemePrimaryHex, getSectionTokens, applyVoice } from "@/lib/theme";
import { getDesignVariant, heroHeadlineClasses, hashSeed, siteSeed } from "@/lib/designVariants";
import {
  resolvePageArchitecture,
  mergeLayoutWithArchitecture,
  layoutStyleSectionOrder,
  type SectionKey,
} from "@/lib/pageArchitectures";
import { getSiteMotion, motionRise } from "@/lib/siteMotion";
import { resolveSiteSignature, widgetRadiusFromSeed } from "@/lib/siteSignature";
import HeroSection from "@/components/HeroSection";
import ProcessSection from "@/components/ProcessSection";
import ProductDetailSheet from "@/components/ProductDetailSheet";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import QuizSection from "@/components/QuizSection";
import SocialProofSection from "@/components/SocialProofSection";
import DemoPlatformCta from "@/components/DemoPlatformCta";
import { BrandConfig, Product } from "@/types/config";
import BookingEngine from "@/components/engines/BookingEngine";
import TicketEngine from "@/components/engines/TicketEngine";
import { PUBLIC_API_URL, WIDGET_CDN_URL } from "@/lib/urls";
import {
  MotionHydrationProvider,
  useMotionHydrated,
} from "@/components/MotionHydrationProvider";
import { motionInitial } from "@/lib/motionInitial";

const PLATFORM_DEMO_WIDGET_ID = 'ec376123-f499-4ad4-88c9-2b63ad6f90ab';

/** Hostnames for the Loom / outreach aesthetic demos (always show platform CTA). */
const PLATFORM_DEMO_HOSTS = new Set([
  'lumina.closetquotes.com',
  'ironclad.closetquotes.com',
  'hearth.closetquotes.com',
]);

function isPlatformDemoSite(config: BrandConfig, hostname?: string): boolean {
  if (config.widgetId === PLATFORM_DEMO_WIDGET_ID) return true;
  const host = (hostname || '').toLowerCase();
  return PLATFORM_DEMO_HOSTS.has(host);
}

interface ClientPageProps {
  config: BrandConfig;
  hostname?: string;
}

const HERO_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c';

function ClientPageContent({ config, hostname }: ClientPageProps) {
  const motionReady = useMotionHydrated();
  // Single canonical seed for the whole site: a resolved (collision-free) design
  // seed if one was assigned at provision time, else the stable site identity.
  // Structure, typography, accent color, CTA and signature all derive from it,
  // so a stored seed reproduces the entire look and two sites diverge fully.
  const fontSeed = siteSeed(config);
  const theme = applyVoice(getThemeStyles(config.theme, config.themeTokens), config.theme, fontSeed, config.themeTokens);
  const tokens = getSectionTokens(config.theme, fontSeed, config.themeTokens);
  const variant = getDesignVariant(fontSeed, config.theme);
  const siteMotion = getSiteMotion(fontSeed);
  const signature = resolveSiteSignature({
    brandName: config.brandName,
    seed: fontSeed,
    signature: config.signature,
    services: config.products?.map((p) => p.title),
  });
  const widgetRadius = widgetRadiusFromSeed(fontSeed);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  // ─── Section Definitions ───

  const heroImage = config.hero.backgroundImage || HERO_FALLBACK_IMAGE;
  const heroHeadline = heroHeadlineClasses(variant.typeScale);
  const heroAlignText = variant.heroAlign === 'left' ? 'text-left' : 'text-center';

  const heroSubheadline = config.hero.subheadline?.trim();
  const renderHeroSub = (colorClass: string, centered: boolean) =>
    heroSubheadline ? (
      <motion.p
        initial={motionRise(siteMotion, motionReady)}
        animate={{ opacity: 1, y: 0 }}
        transition={siteMotion.heroLate}
        className={`mb-10 max-w-2xl text-lg md:text-xl leading-relaxed ${colorClass} ${centered ? 'mx-auto' : ''}`}
      >
        {heroSubheadline}
      </motion.p>
    ) : null;

  const engagementModel = config.engagementModel || 'quote';
  const isOrderBusiness = engagementModel === 'order';
  const isBookingBusiness = engagementModel === 'booking';
  const isTicketBusiness = engagementModel === 'ticket';
  
  const QUOTE_CTA_LABELS = ['Get Your Free Quote', 'Request a Quote', 'Get a Free Estimate', 'Request a Consultation', 'Schedule a Visit'];
  const ORDER_CTA_LABELS = ['Order Now', 'View Menu', 'Start Your Order', 'Order Online', 'Place an Order'];
  const BOOKING_CTA_LABELS = ['Book an Appointment', 'Schedule Now', 'Book a Session', 'Reserve a Time', 'Book Service'];
  const TICKET_CTA_LABELS = ['Get Tickets', 'Buy Tickets', 'Reserve Your Spot', 'Find Tickets', 'Book Event'];
  
  const ctaLabels = isOrderBusiness ? ORDER_CTA_LABELS : isBookingBusiness ? BOOKING_CTA_LABELS : isTicketBusiness ? TICKET_CTA_LABELS : QUOTE_CTA_LABELS;
  const ctaLabel = ctaLabels[hashSeed(`${fontSeed}:cta`) % ctaLabels.length];
  const isPlatformDemo = isPlatformDemoSite(config, hostname);
  const ctaButton = (
    <div className={`flex flex-col items-stretch gap-3 sm:flex-row sm:items-center ${variant.heroAlign === 'left' ? 'sm:justify-start' : 'sm:justify-center'}`}>
      <a href="#quote" className={`inline-block cursor-pointer text-center ${theme.button}`}>
        {ctaLabel}
      </a>
      {isPlatformDemo ? (
        <a
          href="#portfolio"
          className="inline-block cursor-pointer rounded-full border border-white/40 bg-white/10 px-6 py-3 text-center text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
        >
          See the transformation
        </a>
      ) : null}
    </div>
  );

  const PORTFOLIO_TITLES_QUOTE = ['Our Work', 'Recent Projects', 'Featured Jobs', 'What we build', 'Selected projects'];
  const PORTFOLIO_TITLES_ORDER = ['Menu', 'What we serve', 'From the kitchen', 'Popular picks', 'Order favorites'];
  const PORTFOLIO_TITLES_BOOKING = ['Services', 'What we offer', 'Appointments', 'Treatments', 'Book these'];
  const PORTFOLIO_TITLES_TICKET = ['Events', 'Upcoming', 'On the calendar', 'Experiences', 'Get tickets for'];
  const portfolioTitles = isOrderBusiness
    ? PORTFOLIO_TITLES_ORDER
    : isBookingBusiness
      ? PORTFOLIO_TITLES_BOOKING
      : isTicketBusiness
        ? PORTFOLIO_TITLES_TICKET
        : PORTFOLIO_TITLES_QUOTE;
  const portfolioTitle = portfolioTitles[hashSeed(`${fontSeed}:portfolioTitle`) % portfolioTitles.length];
  const widgetTitle = isOrderBusiness
    ? 'Place an order'
    : isBookingBusiness
      ? 'Book a time'
      : isTicketBusiness
        ? 'Get tickets'
        : 'Get an estimate';
  const cardRadiusClass =
    widgetRadius === 'sharp' ? 'rounded-none' : widgetRadius === 'pill' ? 'rounded-2xl' : 'rounded-lg';
  const sectionPadClass = siteMotion.personality === 'commercial' ? 'pb-20' : siteMotion.personality === 'luxury' ? 'pb-36' : 'pb-32';
  const aboutEyebrow = signature.eyebrow;
  const ornament = signature.motif;

  const renderOrnament = (centered: boolean) => {
    switch (ornament) {
      case 'dot':
        return (
          <div className={`mb-5 flex gap-1.5 ${centered ? 'justify-center' : ''}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${tokens.accentBg}`} />
            <span className={`h-1.5 w-1.5 rounded-full ${tokens.accentBg}`} />
            <span className={`h-1.5 w-1.5 rounded-full ${tokens.accentBg}`} />
          </div>
        );
      case 'bar':
        return <div className={`mb-5 h-1 w-12 ${tokens.accentBg} ${centered ? 'mx-auto' : ''}`} />;
      case 'double':
        return (
          <div className={`mb-5 flex flex-col gap-1 ${centered ? 'items-center' : ''}`}>
            <div className={`h-px w-10 ${tokens.accentBg}`} />
            <div className={`h-px w-6 ${tokens.accentBg}`} />
          </div>
        );
      case 'corner-brackets':
        return (
          <div className={`mb-5 flex items-center gap-3 ${centered ? 'justify-center' : ''}`}>
            <span className={`h-3 w-3 border-l-2 border-t-2 ${theme.accentColor}`} />
            <span className={`h-px w-8 ${tokens.accentBg}`} />
            <span className={`h-3 w-3 border-r-2 border-t-2 ${theme.accentColor}`} />
          </div>
        );
      case 'rule-stack':
        return (
          <div className={`mb-5 flex flex-col gap-1.5 ${centered ? 'items-center' : ''}`}>
            <div className={`h-px w-16 ${tokens.accentBg}`} />
            <div className={`h-px w-10 ${tokens.accentBg} opacity-70`} />
            <div className={`h-px w-6 ${tokens.accentBg} opacity-40`} />
          </div>
        );
      case 'seal':
        return (
          <div className={`mb-5 flex ${centered ? 'justify-center' : ''}`}>
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 ${tokens.surfaceBorder}`}>
              <span className={`h-2 w-2 rounded-full ${tokens.accentBg}`} />
            </span>
          </div>
        );
      case 'ribbon':
        return (
          <div className={`mb-5 ${centered ? 'flex justify-center' : ''}`}>
            <span className={`inline-block h-2 w-20 ${tokens.accentBg}`} />
          </div>
        );
      case 'line':
      default:
        return <div className={`mb-5 h-px w-10 ${tokens.accentBg} ${centered ? 'mx-auto' : ''}`} />;
    }
  };

  const sectionEyebrow = (label: string, centered: boolean) => (
    <div className={centered ? 'flex flex-col items-center' : ''}>
      {renderOrnament(centered)}
      <h2 className={`text-sm uppercase tracking-widest ${theme.accentColor} font-bold`}>
        {label}
      </h2>
    </div>
  );

  const heroSection = (
    <HeroSection
      key="hero"
      variant={variant}
      theme={theme}
      tokens={tokens}
      headline={config.hero.headline}
      subheadline={heroSubheadline}
      heroImage={heroImage}
      brandName={config.brandName}
      ctaButton={ctaButton}
      heroHeadlineClasses={heroHeadline}
      ornament={ornament}
      motionProfile={siteMotion}
    />
  );

  const renderAbout = () => {
    // ── Asymmetric: eyebrow column beside a large statement ──
    if (variant.about === 'aside') {
      return (
        <section key="about" id="about" className={theme.containerClasses}>
          <motion.div
            initial={motionInitial(motionReady, { opacity: 0, y: 40 })}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-16"
          >
            {sectionEyebrow(aboutEyebrow, false)}
            <p className={`md:col-span-2 text-2xl md:text-4xl leading-snug ${theme.textPrimary}`}>
              {config.about.description}
            </p>
          </motion.div>
        </section>
      );
    }

    // ── Full-width statement, no eyebrow, oversized ──
    if (variant.about === 'statement') {
      return (
        <section key="about" id="about" className={theme.containerClasses}>
          <motion.div
            initial={motionInitial(motionReady, { opacity: 0, y: 40 })}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-5xl"
          >
            <p className={`text-xl md:text-3xl leading-snug ${theme.textPrimary} ${theme.headingFont}`}>
              {config.about.description}
            </p>
          </motion.div>
        </section>
      );
    }

    // ── Statement inside a bordered panel with an accent rule ──
    if (variant.about === 'bordered') {
      return (
        <section key="about" id="about" className={theme.containerClasses}>
          <motion.div
            initial={motionInitial(motionReady, { opacity: 0, y: 40 })}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className={`mx-auto max-w-4xl border ${tokens.surfaceBorder} ${tokens.surface} px-8 py-14 md:px-16 md:py-20`}
          >
            <div className="mb-6">{sectionEyebrow(aboutEyebrow, false)}</div>
            <p className={`text-2xl md:text-3xl leading-snug ${theme.textPrimary}`}>
              {config.about.description}
            </p>
          </motion.div>
        </section>
      );
    }

    // ── Heading over a two-column flowing text block ──
    if (variant.about === 'columns') {
      return (
        <section key="about" id="about" className={theme.containerClasses}>
          <motion.div
            initial={motionInitial(motionReady, { opacity: 0, y: 40 })}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-5xl"
          >
            {renderOrnament(false)}
            <h2 className={`mb-10 max-w-3xl text-3xl md:text-5xl leading-tight ${theme.headingFont} ${theme.textPrimary}`}>
              {aboutEyebrow}
            </h2>
            <p className={`columns-1 gap-12 text-lg md:columns-2 md:text-xl leading-relaxed ${theme.textSecondary}`}>
              {config.about.description}
            </p>
          </motion.div>
        </section>
      );
    }

    // ── Centered (default) ──
    return (
      <section key="about" id="about" className={theme.containerClasses}>
        <motion.div
          initial={motionInitial(motionReady, { opacity: 0, y: 40 })}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-8">{sectionEyebrow(aboutEyebrow, true)}</div>
          <p className={`text-xl md:text-3xl leading-relaxed ${theme.textSecondary}`}>
            {config.about.description}
          </p>
        </motion.div>
      </section>
    );
  };

  const aboutSection = renderAbout();

  const processWithSignature = {
    ...config.process,
    title: signature.processName || config.process.title,
  };
  const processSection = (
    <ProcessSection
      key="process"
      theme={config.theme}
      themeTokens={config.themeTokens}
      fontSeed={fontSeed}
      process={processWithSignature}
    />
  );

  const beforeAfterSection = <BeforeAfterSlider key="ba" theme={config.theme} themeTokens={config.themeTokens} fontSeed={fontSeed} config={config.beforeAfter} />;

  const socialProofSection = config.socialProof ? (
    <SocialProofSection
      key="social-proof"
      config={config.socialProof}
      theme={config.theme}
      themeTokens={config.themeTokens}
      fontSeed={fontSeed}
    />
  ) : null;

  // Portfolio composition varies by design variant: a clean grid, a wider
  // showcase of larger cards, an editorial layout with taller imagery, a
  // staggered masonry, or framed cards with a bordered mat.
  const isMasonry = variant.portfolio === 'masonry';
  const isFramedPortfolio = variant.portfolio === 'framed';
  const portfolioGridClasses = isMasonry
    ? 'columns-1 md:columns-2 lg:columns-3 gap-8 max-w-6xl mx-auto'
    : variant.portfolio === 'showcase'
      ? 'grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto'
      : getGridClasses(config.products.length);
  const portfolioItemExtra = `${isMasonry ? 'mb-8 break-inside-avoid' : ''} ${isFramedPortfolio ? `border ${tokens.surfaceBorder} p-3` : ''}`;
  const portfolioAspectFor = (idx: number) => {
    if (isMasonry) return ['aspect-[4/5]', 'aspect-square', 'aspect-[3/4]'][idx % 3];
    if (variant.portfolio === 'showcase') return 'aspect-[3/2]';
    if (variant.portfolio === 'editorial') return 'aspect-[4/3]';
    if (isFramedPortfolio) return 'aspect-[4/3]';
    return 'aspect-[4/5]';
  };

  const portfolioSection = (
    <section key="portfolio" id="portfolio" className={`px-6 ${sectionPadClass} max-w-screen-2xl mx-auto`}>
      {variant.portfolio !== 'grid' && (
        <div className={variant.portfolio === 'editorial' ? 'mb-12' : 'mb-12 flex flex-col items-center'}>
          {renderOrnament(variant.portfolio !== 'editorial')}
          <motion.h2
            initial={motionInitial(motionReady, { opacity: 0, y: 20 })}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className={`${variant.portfolio === 'editorial' ? 'text-left text-4xl md:text-5xl' : 'text-center text-3xl md:text-4xl'} ${theme.headingFont} ${theme.textPrimary}`}
          >
            {portfolioTitle}
          </motion.h2>
        </div>
      )}
      <div className={portfolioGridClasses}>
        {config.products.map((product, idx) => (
          <motion.div 
            key={idx}
            initial={motionInitial(motionReady, { opacity: 0, y: 50 })}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: idx * 0.2 }}
            className={`flex flex-col cursor-pointer ${theme.productCard} ${portfolioItemExtra} overflow-hidden ${cardRadiusClass}`}
            onClick={() => setSelectedProduct(product)}
          >
            <div className={`relative ${portfolioAspectFor(idx)} w-full overflow-hidden`}>
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className={`object-cover ${theme.productImageHover}`}
                />
              ) : (
                <div className={`absolute inset-0 flex items-center justify-center ${tokens.accentBg} opacity-80`}>
                  <span className={`text-3xl font-semibold ${theme.headingFont} text-white/90`}>
                    {product.title.slice(0, 1)}
                  </span>
                </div>
              )}
            </div>
            <div className="p-8">
              <h3 className={`mb-4 text-2xl ${theme.headingFont}`}>
                {product.title}
              </h3>
              <p className={`leading-relaxed ${theme.textSecondary}`}>
                {product.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );

  const quizSection = <QuizSection key="quiz" theme={config.theme} themeTokens={config.themeTokens} quizConfig={config.quiz} fontSeed={fontSeed} onComplete={setQuizAnswers} engagementModel={config.engagementModel} />;

  // Deterministic quote-vs-order detection happens above.

  const widgetSection = (
    <section key="widget" id="quote" className={`py-20 md:py-28 ${theme.pageBackground}`}>
      <div className="mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={siteMotion.section}
        >
          <div className="mb-4 flex flex-col items-center">
            {renderOrnament(true)}
            <h2 className={`text-4xl ${theme.headingFont}`}>
              {isOrderBusiness ? 'Order Online' : isBookingBusiness ? 'Book Now' : isTicketBusiness ? 'Get Tickets' : 'Get an Instant Quote'}
            </h2>
          </div>
          <p className={`${config.pricingNotes ? 'mb-4' : 'mb-12'} text-lg ${theme.textSecondary}`}>
            {isOrderBusiness
              ? 'Browse the menu and place your order.'
              : isBookingBusiness
                ? 'Pick a service and a time that works for you.'
                : isTicketBusiness
                  ? 'Choose a date and reserve your spot.'
                  : 'Tell us about your project and get a clear estimate.'}
          </p>
          {config.pricingNotes && (
            <p className={`mx-auto mb-12 max-w-2xl text-sm ${theme.textSecondary} opacity-80`}>
              {config.pricingNotes}
            </p>
          )}
          
          <div className="mx-auto w-full text-left">
            <Script src={WIDGET_CDN_URL} strategy="lazyOnload" />
            {isOrderBusiness ? (
              // @ts-expect-error Custom web component
              <closet-order-widget
                data-contractor-id={config.widgetId}
                data-api-url={PUBLIC_API_URL}
                data-radius={widgetRadius}
                data-font-heading={theme.headingFont}
                data-widget-title={widgetTitle}
              />
            ) : isBookingBusiness ? (
              <BookingEngine 
                contractorId={config.widgetId}
                accentColor={getThemePrimaryHex(config.theme, fontSeed, config.themeTokens)}
                radius={widgetRadius}
              />
            ) : isTicketBusiness ? (
              <TicketEngine 
                contractorId={config.widgetId}
                accentColor={getThemePrimaryHex(config.theme, fontSeed, config.themeTokens)}
                radius={widgetRadius}
              />
            ) : (
              // @ts-expect-error Custom web component
              <closet-quote-widget 
                data-contractor-id={config.widgetId} 
                data-api-url={PUBLIC_API_URL}
                data-contractor-name={config.brandName}
                data-default-room={config.defaultRoom || ''}
                data-radius={widgetRadius}
                data-font-heading={theme.headingFont}
                data-widget-title={widgetTitle}
                data-quiz-frustration={quizAnswers.frustration || ''}
                data-quiz-style={quizAnswers.style || ''}
                data-quiz-timeline={quizAnswers.timeline || ''}
              />
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );

  // ─── Dynamic Layout Engine ───

  const renderLayout = () => {
    const style = config.layoutStyle || 'standard';
    const architecture = resolvePageArchitecture({
      engagementModel,
      layoutStyle: style,
      seed: fontSeed,
    });

    const byKey: Record<SectionKey, React.ReactNode> = {
      hero: heroSection,
      about: aboutSection,
      process: processSection,
      beforeAfter: beforeAfterSection,
      portfolio: portfolioSection,
      socialProof: socialProofSection,
      quiz: quizSection,
      widget: widgetSection,
    };

    const order = mergeLayoutWithArchitecture(architecture, layoutStyleSectionOrder(style));
    let sections = order.map((k) => byKey[k]).filter(Boolean);

    // Skip before/after when not configured (not-applicable industries).
    if (!config.beforeAfter) {
      sections = sections.filter((s) => s !== beforeAfterSection);
    }

    // Order businesses: never show process / quiz / before-after.
    if (isOrderBusiness) {
      sections = sections.filter(
        (s) => s !== processSection && s !== beforeAfterSection && s !== quizSection
      );
    }

    return sections;
  };

  // Multi-page sites render the full <Navbar> in the layout. Rendering this
  // logo-only header too would double the logo AND, because it's a full-width
  // z-50 box, swallow clicks meant for the nav links until you scroll past it.
  const hasNav = !!(config.navLinks && config.navLinks.length > 0);

  return (
    <div className={`min-h-screen ${theme.pageBackground} ${theme.textPrimary} ${theme.bodyFont}`}>
      {/* ─── Global Header (only when the layout's Navbar isn't present) ─── */}
      {!hasNav && (
        <header className="pointer-events-none absolute top-0 z-50 w-full py-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
            <motion.div 
              initial={motionInitial(motionReady, { opacity: 0, y: -20 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`text-xl ${theme.headingFont} text-white`}
            >
              {config.logoUrl ? (
                <Image
                  src={config.logoUrl}
                  alt={config.brandName}
                  width={280}
                  height={90}
                  className="h-16 w-auto object-contain sm:h-20"
                  priority
                />
              ) : (
                config.brandName
              )}
            </motion.div>
          </div>
        </header>
      )}

      {/* Render selected structural layout */}
      {renderLayout()}

      {isPlatformDemo ? (
        <>
          <div className="h-24" aria-hidden />
          <DemoPlatformCta brandName={config.brandName} />
        </>
      ) : null}

      {/* ─── Interactive Product Detail Sheet (Global) ─── */}
      <ProductDetailSheet 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        product={selectedProduct} 
        theme={config.theme} 
        themeTokens={config.themeTokens}
        fontSeed={fontSeed}
      />
    </div>
  );
}

export default function ClientPage(props: ClientPageProps) {
  return (
    <MotionHydrationProvider>
      <ClientPageContent {...props} />
    </MotionHydrationProvider>
  );
}
