"use client";

import React, { useState } from "react";
import Image from "next/image";
import Script from "next/script";
import * as motion from "framer-motion/client";
import { getThemeStyles } from "@/lib/theme";
import ProcessSection from "@/components/ProcessSection";
import ProductDetailSheet from "@/components/ProductDetailSheet";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import QuizSection from "@/components/QuizSection";
import { BrandConfig, Product } from "@/types/config";
import { PUBLIC_API_URL, WIDGET_CDN_URL } from "@/lib/urls";
import {
  MotionHydrationProvider,
  useMotionHydrated,
} from "@/components/MotionHydrationProvider";
import { motionInitial } from "@/lib/motionInitial";

interface ClientPageProps {
  config: BrandConfig;
}

function ClientPageContent({ config }: ClientPageProps) {
  const motionReady = useMotionHydrated();
  const theme = getThemeStyles(config.theme);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  // ─── Section Definitions ───

  const heroSection = (
    <section key="hero" className="relative flex min-h-[90vh] items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src={config.hero.backgroundImage || 'https://images.unsplash.com/photo-1558211583-d26f610c1eb1'}
          alt={config.hero.headline}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className={`absolute inset-0 ${theme.heroGradient}`} />
      </div>
      
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <motion.h1 
          initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className={`text-5xl md:text-7xl ${theme.headingFont} text-white mb-8 leading-tight`}
        >
          {config.hero.headline}
        </motion.h1>
        <motion.div
          initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
        >
          <a href="#quote" className={`inline-block cursor-pointer ${theme.button}`}>
            Request a Consultation
          </a>
        </motion.div>
      </div>
    </section>
  );

  const aboutSection = (
    <section key="about" className={theme.containerClasses}>
      <motion.div 
        initial={motionInitial(motionReady, { opacity: 0, y: 40 })}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="mx-auto max-w-3xl text-center"
      >
        <h2 className={`mb-8 text-sm uppercase tracking-widest ${theme.accentColor} font-bold`}>
          Our Philosophy
        </h2>
        <p className={`text-xl md:text-3xl leading-relaxed ${theme.textSecondary}`}>
          {config.about.description}
        </p>
      </motion.div>
    </section>
  );

  const processSection = <ProcessSection key="process" theme={config.theme} process={config.process} />;

  const beforeAfterSection = <BeforeAfterSlider key="ba" theme={config.theme} config={config.beforeAfter} />;

  const portfolioSection = (
    <section key="portfolio" className={`px-6 pb-32 max-w-screen-2xl mx-auto`}>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {config.products.map((product, idx) => (
          <motion.div 
            key={idx}
            initial={motionInitial(motionReady, { opacity: 0, y: 50 })}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: idx * 0.2 }}
            className={`flex flex-col cursor-pointer ${theme.productCard}`}
            onClick={() => setSelectedProduct(product)}
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden">
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

  const quizSection = <QuizSection key="quiz" theme={config.theme} onComplete={setQuizAnswers} />;

  const widgetSection = (
    <section key="widget" id="quote" className={`py-32 ${theme.pageBackground}`}>
      <div className="mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className={`mb-4 text-4xl ${theme.headingFont}`}>
            Get an Instant Quote
          </h2>
          <p className={`${config.pricingNotes ? 'mb-4' : 'mb-12'} text-lg ${theme.textSecondary}`}>
            Configure your <strong>{config.defaultRoom}</strong> and get a price estimate instantly.
          </p>
          {config.pricingNotes && (
            <p className={`mx-auto mb-12 max-w-2xl text-sm ${theme.textSecondary} opacity-80`}>
              {config.pricingNotes}
            </p>
          )}
          
          <div className="mx-auto w-full text-left">
            <Script src={WIDGET_CDN_URL} strategy="lazyOnload" />
            {/* @ts-expect-error Custom web component */}
            <closet-quote-widget 
              data-contractor-id={config.widgetId} 
              data-api-url={PUBLIC_API_URL}
              data-quiz-frustration={quizAnswers.frustration || ''}
              data-quiz-style={quizAnswers.style || ''}
              data-quiz-timeline={quizAnswers.timeline || ''}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );

  // ─── Dynamic Layout Engine ───

  const renderLayout = () => {
    const style = config.layoutStyle || 'standard';
    
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
      case 'standard':
      default:
        return [heroSection, aboutSection, processSection, beforeAfterSection, portfolioSection, quizSection, widgetSection];
    }
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
                  width={180}
                  height={48}
                  className="h-10 w-auto object-contain"
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
