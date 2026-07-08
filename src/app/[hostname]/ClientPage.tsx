"use client";

import React, { useState } from "react";
import Image from "next/image";
import Script from "next/script";
import * as motion from "framer-motion/client";
import { getThemeStyles, getGridClasses, getThemePrimaryHex, getSectionTokens, applyVoice } from "@/lib/theme";
import { getDesignVariant, heroHeadlineClasses, hashSeed, siteSeed } from "@/lib/designVariants";
import HeroSection from "@/components/HeroSection";
import ProcessSection from "@/components/ProcessSection";
import ProductDetailSheet from "@/components/ProductDetailSheet";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import QuizSection from "@/components/QuizSection";
import { BrandConfig, Product } from "@/types/config";
import BookingEngine from "@/components/engines/BookingEngine";
import TicketEngine from "@/components/engines/TicketEngine";
import { PUBLIC_API_URL, WIDGET_CDN_URL } from "@/lib/urls";
import {
  MotionHydrationProvider,
  useMotionHydrated,
} from "@/components/MotionHydrationProvider";
import { motionInitial } from "@/lib/motionInitial";

interface ClientPageProps {
  config: BrandConfig;
}

const HERO_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1558211583-d26f610c1eb1';

function ClientPageContent({ config }: ClientPageProps) {
  const motionReady = useMotionHydrated();
  // Single canonical seed for the whole site: a resolved (collision-free) design
  // seed if one was assigned at provision time, else the stable site identity.
  // Structure, typography, accent color, CTA and signature all derive from it,
  // so a stored seed reproduces the entire look and two sites diverge fully.
  const fontSeed = siteSeed(config);
  const theme = applyVoice(getThemeStyles(config.theme, config.themeTokens), config.theme, fontSeed, config.themeTokens);
  const tokens = getSectionTokens(config.theme, fontSeed, config.themeTokens);
  // Stable per-site composition: explicit seed wins, else derive from identity
  // so two sites that resolve to the same theme + layout still diverge. The
  // theme biases the hero/type toward an on-brand "fit".
  const variant = getDesignVariant(fontSeed, config.theme);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  // ─── Section Definitions ───

  const heroImage = config.hero.backgroundImage || HERO_FALLBACK_IMAGE;
  const heroHeadline = heroHeadlineClasses(variant.typeScale);
  const heroAlignText = variant.heroAlign === 'left' ? 'text-left' : 'text-center';

  // Supporting line under the hero headline — the "headline + subhead" pairing
  // that premium sites use. Rendered only when copy is present.
  const heroSubheadline = config.hero.subheadline?.trim();
  const renderHeroSub = (colorClass: string, centered: boolean) =>
    heroSubheadline ? (
      <motion.p
        initial={motionInitial(motionReady, { opacity: 0, y: 20 })}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.32, ease: "easeOut" }}
        className={`mb-10 max-w-2xl text-lg md:text-xl leading-relaxed ${colorClass} ${centered ? 'mx-auto' : ''}`}
      >
        {heroSubheadline}
      </motion.p>
    ) : null;

  // Deterministic detection of engagement model
  const engagementModel = config.engagementModel || 'quote';
  const isOrderBusiness = engagementModel === 'order';
  const isBookingBusiness = engagementModel === 'booking';
  const isTicketBusiness = engagementModel === 'ticket';
  
  // Vary the hero CTA label across sites (seeded, stable) so the call-to-action
  // doesn't read as templated. All options anchor to the #quote widget.
  // Trade-neutral quote CTAs so a tree service, plumber, cleaner, or closet
  // builder all read naturally — no design/build-specific verbiage that only
  // fits one trade (e.g. "Book a Design Consultation").
  const QUOTE_CTA_LABELS = ['Get Your Free Quote', 'Request a Quote', 'Get a Free Estimate', 'Request a Consultation', 'Schedule a Visit'];
  const ORDER_CTA_LABELS = ['Order Now', 'View Menu', 'Start Your Order', 'Order Online', 'Place an Order'];
  const BOOKING_CTA_LABELS = ['Book an Appointment', 'Schedule Now', 'Book a Session', 'Reserve a Time', 'Book Service'];
  const TICKET_CTA_LABELS = ['Get Tickets', 'Buy Tickets', 'Reserve Your Spot', 'Find Tickets', 'Book Event'];
  
  const ctaLabels = isOrderBusiness ? ORDER_CTA_LABELS : isBookingBusiness ? BOOKING_CTA_LABELS : isTicketBusiness ? TICKET_CTA_LABELS : QUOTE_CTA_LABELS;
  const ctaLabel = ctaLabels[hashSeed(`${fontSeed}:cta`) % ctaLabels.length];
  const ctaButton = (
    <a href="#quote" className={`inline-block cursor-pointer ${theme.button}`}>
      {ctaLabel}
    </a>
  );

  // ─── Signature treatment ───
  // A recurring "designer mark" (ornament) and varied section eyebrow, both
  // seeded per site so two sites on the same theme still feel hand-designed,
  // and both themed via the active accent so they read correctly on every
  // palette. The ornament recurs across About / Portfolio / Quote sections to
  // give the page a cohesive, intentional identity instead of a templated feel.
  const EYEBROW_LABELS = [
    'Our Philosophy', 'Who We Are', 'Our Approach', 'The Difference',
    'Our Standard', 'Our Story', 'The Craft', 'Why Choose Us',
  ];
  const ORNAMENTS = ['line', 'dot', 'bar', 'double'] as const;
  const signatureSeed = fontSeed;
  const aboutEyebrow = EYEBROW_LABELS[hashSeed(`${signatureSeed}:eyebrow`) % EYEBROW_LABELS.length];
  const ornament: (typeof ORNAMENTS)[number] =
    ORNAMENTS[hashSeed(`${signatureSeed}:ornament`) % ORNAMENTS.length];

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

  const processSection = <ProcessSection key="process" theme={config.theme} themeTokens={config.themeTokens} fontSeed={fontSeed} process={config.process} />;

  const beforeAfterSection = <BeforeAfterSlider key="ba" theme={config.theme} themeTokens={config.themeTokens} fontSeed={fontSeed} config={config.beforeAfter} />;

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
    <section key="portfolio" id="portfolio" className={`px-6 pb-32 max-w-screen-2xl mx-auto`}>
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
            Selected Work
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
            className={`flex flex-col cursor-pointer ${theme.productCard} ${portfolioItemExtra}`}
            onClick={() => setSelectedProduct(product)}
          >
            <div className={`relative ${portfolioAspectFor(idx)} w-full overflow-hidden`}>
              <Image
                src={product.image || 'https://images.unsplash.com/photo-1595428774223-ef52624120d2'}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className={`object-cover ${theme.productImageHover}`}
              />
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

  const quizSection = <QuizSection key="quiz" theme={config.theme} themeTokens={config.themeTokens} quizConfig={config.quiz} fontSeed={fontSeed} onComplete={setQuizAnswers} />;

  // Deterministic quote-vs-order detection happens above.

  const widgetSection = (
    <section key="widget" id="quote" className={`py-32 ${theme.pageBackground}`}>
      <div className="mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-4 flex flex-col items-center">
            {renderOrnament(true)}
            <h2 className={`text-4xl ${theme.headingFont}`}>
              {isOrderBusiness ? 'Order Online' : isBookingBusiness ? 'Book Now' : isTicketBusiness ? 'Get Tickets' : 'Get an Instant Quote'}
            </h2>
          </div>
          <p className={`${config.pricingNotes ? 'mb-4' : 'mb-12'} text-lg ${theme.textSecondary}`}>
            {isOrderBusiness ? 'Browse our menu and place your order — pickup and delivery available.'
              : isBookingBusiness ? 'Select a service and time slot to book your appointment.'
              : isTicketBusiness ? 'Select your event date and reserve your tickets.'
              : <>Configure your <strong>{config.defaultRoom}</strong> and get a price estimate instantly.</>}
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
                data-preview-color={getThemePrimaryHex(config.theme, fontSeed, config.themeTokens)}
              />
            ) : isBookingBusiness ? (
              <BookingEngine 
                contractorId={config.widgetId}
                accentColor={getThemePrimaryHex(config.theme, fontSeed, config.themeTokens)}
              />
            ) : isTicketBusiness ? (
              <TicketEngine 
                contractorId={config.widgetId}
                accentColor={getThemePrimaryHex(config.theme, fontSeed, config.themeTokens)}
              />
            ) : (
              // @ts-expect-error Custom web component
              <closet-quote-widget 
                data-contractor-id={config.widgetId} 
                data-api-url={PUBLIC_API_URL}
                data-preview-color={getThemePrimaryHex(config.theme, fontSeed, config.themeTokens)}
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

    const sections = (() => {
      switch (style) {
        case 'portfolio-first':
          return [heroSection, portfolioSection, beforeAfterSection, aboutSection, processSection, quizSection, widgetSection];
        case 'conversion-focus':
          return [heroSection, widgetSection, beforeAfterSection, portfolioSection, aboutSection];
        case 'storyteller':
          return [heroSection, aboutSection, quizSection, portfolioSection, processSection, widgetSection, beforeAfterSection];
        case 'minimalist-lead':
          return [heroSection, quizSection, widgetSection];
        case 'visual-impact':
          return [heroSection, beforeAfterSection, portfolioSection, widgetSection];
        case 'trust-builder':
          return [heroSection, aboutSection, processSection, beforeAfterSection, portfolioSection, quizSection, widgetSection];
        case 'gallery-showcase':
          return [heroSection, portfolioSection, beforeAfterSection, aboutSection, quizSection, widgetSection];
        case 'local-expert':
          return [heroSection, aboutSection, processSection, portfolioSection, beforeAfterSection, quizSection, widgetSection];
        case 'compact-quote':
          return [heroSection, quizSection, widgetSection];
        // New trade-vertical layouts
        case 'emergency-first':
          return [heroSection, widgetSection, aboutSection, beforeAfterSection, portfolioSection];
        case 'before-after':
          return [heroSection, beforeAfterSection, portfolioSection, aboutSection, quizSection, widgetSection];
        case 'process-steps':
          return [heroSection, processSection, aboutSection, portfolioSection, quizSection, widgetSection];
        case 'seasonal-cta':
          return [heroSection, widgetSection, portfolioSection, aboutSection, processSection];
        case 'trust-report':
          return [heroSection, aboutSection, processSection, portfolioSection, beforeAfterSection, quizSection, widgetSection];
        case 'service-zones':
          return [heroSection, aboutSection, portfolioSection, quizSection, widgetSection];
        case 'event-booking':
          return [heroSection, portfolioSection, aboutSection, quizSection, widgetSection];
        case 'standard':
        default:
          return [heroSection, aboutSection, processSection, beforeAfterSection, portfolioSection, quizSection, widgetSection];
      }
    })();

    // Skip the before/after slider entirely for businesses with no physical
    // "before" state (order/direct-purchase, pure professional services,
    // ticketed/booking, person-body-sensitive) — config.beforeAfter is
    // absent/null when the industry's BeforeAfterCategory is
    // 'not-applicable' (see closet-dashboard's openai-images.ts docstring).
    let filteredSections = config.beforeAfter ? sections : sections.filter((s) => s !== beforeAfterSection);
    
    // Order businesses (like restaurants/food trucks) do not follow a project
    // "Process" (Consultation -> Design -> Install) or have "Before/After"
    // states, and don't need a lead-qualification Quiz. Strip those sections
    // out even if the layout/db included them.
    if (isOrderBusiness) {
      filteredSections = filteredSections.filter((s) => s !== processSection && s !== beforeAfterSection && s !== quizSection);
    }
    
    return filteredSections;
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
