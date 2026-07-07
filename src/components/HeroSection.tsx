"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { DesignVariant } from "@/lib/designVariants";

interface HeroSectionProps {
  variant: DesignVariant;
  theme: any;
  tokens: any;
  headline: string;
  subheadline?: string;
  heroImage: string;
  brandName?: string;
  ctaButton?: React.ReactNode;
  heroHeadlineClasses: string;
  ornament?: 'line' | 'dot' | 'bar' | 'double';
}

export default function HeroSection({
  variant,
  theme,
  tokens,
  headline,
  subheadline,
  heroImage,
  brandName,
  ctaButton,
  heroHeadlineClasses,
  ornament = 'line',
}: HeroSectionProps) {
  const [motionReady, setMotionReady] = useState(false);
  useEffect(() => {
    setMotionReady(true);
  }, []);

  const motionInitial = (ready: boolean, style: any) =>
    ready ? style : { opacity: 0 };

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

  const renderHeroSub = (colorClass: string, centered: boolean) =>
    subheadline ? (
      <motion.p
        initial={motionInitial(motionReady, { opacity: 0, y: 20 })}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.32, ease: "easeOut" }}
        className={`mb-10 max-w-2xl text-lg md:text-xl leading-relaxed ${colorClass} ${centered ? 'mx-auto' : ''}`}
      >
        {subheadline}
      </motion.p>
    ) : null;

  const heroAlignText = variant.heroAlign === 'center' ? 'text-center' : 'text-left';

  // Map any "small image" variants to "huge image" variants to ensure
  // the bespoke AI-generated images are always shown off prominently.
  let effectiveHero: string = variant.hero;
  switch (effectiveHero) {
    case 'gallery': effectiveHero = 'cinematic'; break;
    case 'spotlight': effectiveHero = 'split'; break;
    case 'refined': effectiveHero = 'framed'; break;
    case 'sidebar': effectiveHero = 'split'; break;
    case 'portrait': effectiveHero = 'overlap'; break;
    case 'masthead': effectiveHero = 'stacked'; break;
    case 'canvas': effectiveHero = 'duotone'; break;
  }

  switch (effectiveHero) {
    case 'split':
      return (
        <section key="hero" className="relative grid min-h-[90vh] grid-cols-1 overflow-hidden md:grid-cols-2">
          <div className={`relative z-10 flex items-center ${tokens.surface} px-8 py-24 md:px-16`}>
            <div className="max-w-xl">
              <motion.h1
                initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className={`mb-8 ${heroHeadlineClasses} ${theme.headingFont} ${theme.textPrimary}`}
              >
                {headline}
              </motion.h1>
              {renderHeroSub(theme.textSecondary, false)}
              {ctaButton && (
                <motion.div
                  initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                >
                  {ctaButton}
                </motion.div>
              )}
            </div>
          </div>
          <div className="relative min-h-[40vh] md:min-h-full">
            <Image src={heroImage} alt={headline} fill sizes="50vw" className="object-cover" priority />
          </div>
        </section>
      );

    case 'editorial':
      return (
        <section key="hero" className={`relative overflow-hidden pt-44 pb-0 ${theme.pageBackground}`}>
          <div className="mx-auto max-w-7xl px-6 md:px-10">
            <motion.h1
              initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className={`max-w-4xl ${heroHeadlineClasses} ${theme.headingFont} ${theme.textPrimary}`}
            >
              {headline}
            </motion.h1>
            {renderHeroSub(theme.textSecondary, false)}
            {ctaButton && (
              <motion.div
                initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                className="mt-10"
              >
                {ctaButton}
              </motion.div>
            )}
            <div className="relative mt-16 aspect-[21/9] w-full overflow-hidden">
              <Image src={heroImage} alt={headline} fill sizes="100vw" className="object-cover" priority />
            </div>
          </div>
        </section>
      );

    case 'gallery':
      return (
        <section key="hero" className={`relative overflow-hidden pt-48 pb-16 ${theme.pageBackground}`}>
          <div className="mx-auto max-w-5xl px-6 text-center">
            <motion.h1
              initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className={`mx-auto mb-10 max-w-3xl ${heroHeadlineClasses} ${theme.headingFont} ${theme.textPrimary}`}
            >
              {headline}
            </motion.h1>
            {renderHeroSub(theme.textSecondary, true)}
            {ctaButton && (
              <motion.div
                initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                className="mb-14"
              >
                {ctaButton}
              </motion.div>
            )}
          </div>
          <div className="mx-auto max-w-6xl px-6">
            <div className={`relative aspect-[16/7] w-full overflow-hidden border ${tokens.surfaceBorder}`}>
              <Image src={heroImage} alt={headline} fill sizes="100vw" className="object-cover" priority />
            </div>
          </div>
        </section>
      );

    case 'spotlight':
      return (
        <section key="hero" className={`relative overflow-hidden pt-40 pb-28 ${theme.pageBackground}`}>
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-5 md:gap-16">
            <div className="md:col-span-2">
              <motion.h1
                initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className={`mb-8 ${heroHeadlineClasses} ${theme.headingFont} ${theme.textPrimary}`}
              >
                {headline}
              </motion.h1>
              {renderHeroSub(theme.textSecondary, false)}
              {ctaButton && (
                <motion.div
                  initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                >
                  {ctaButton}
                </motion.div>
              )}
            </div>
            <div className="md:col-span-3">
              <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl shadow-2xl">
                <Image src={heroImage} alt={headline} fill sizes="(max-width: 768px) 100vw, 60vw" className="object-cover" priority />
              </div>
            </div>
          </div>
        </section>
      );

    case 'refined':
      return (
        <section key="hero" className={`relative overflow-hidden pt-48 pb-24 ${theme.pageBackground}`}>
          <div className="mx-auto max-w-4xl px-6 text-center">
            <motion.h1
              initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className={`mx-auto mb-12 max-w-2xl ${heroHeadlineClasses} ${theme.headingFont} ${theme.textPrimary}`}
            >
              {headline}
            </motion.h1>
            {renderHeroSub(theme.textSecondary, true)}
            {ctaButton && (
              <motion.div
                initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                className="mb-20"
              >
                {ctaButton}
              </motion.div>
            )}
            <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden">
              <Image src={heroImage} alt={headline} fill sizes="(max-width: 768px) 100vw, 28rem" className="object-cover" priority />
            </div>
          </div>
        </section>
      );

    case 'framed':
      return (
        <section key="hero" className={`relative overflow-hidden p-3 md:p-6 ${theme.pageBackground}`}>
          <div className={`relative flex min-h-[84vh] items-end overflow-hidden border-2 ${tokens.surfaceBorder}`}>
            <div className="absolute inset-0 z-0">
              <Image src={heroImage} alt={headline} fill sizes="100vw" className="object-cover" priority />
              <div className={`absolute inset-0 ${theme.heroGradient}`} />
            </div>
            <div className={`relative z-10 w-full px-8 py-12 md:px-16 md:py-20 ${heroAlignText}`}>
              <motion.h1
                initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className={`mb-8 max-w-4xl ${heroHeadlineClasses} ${theme.headingFont} text-white`}
              >
                {headline}
              </motion.h1>
              {renderHeroSub('text-white/85', variant.heroAlign === 'center')}
              {ctaButton && (
                <motion.div
                  initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                >
                  {ctaButton}
                </motion.div>
              )}
            </div>
          </div>
        </section>
      );

    case 'sidebar':
      return (
        <section key="hero" className="relative grid min-h-[90vh] grid-cols-1 overflow-hidden md:grid-cols-3">
          <div className="relative min-h-[36vh] md:min-h-full">
            <Image src={heroImage} alt={headline} fill sizes="33vw" className="object-cover" priority />
          </div>
          <div className={`relative z-10 flex items-center md:col-span-2 ${theme.pageBackground} px-8 py-24 md:px-20`}>
            <div className="max-w-2xl">
              <motion.h1
                initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className={`mb-8 ${heroHeadlineClasses} ${theme.headingFont} ${theme.textPrimary}`}
              >
                {headline}
              </motion.h1>
              {renderHeroSub(theme.textSecondary, false)}
              {ctaButton && (
                <motion.div
                  initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                >
                  {ctaButton}
                </motion.div>
              )}
            </div>
          </div>
        </section>
      );

    case 'overlap':
      return (
        <section key="hero" className={`relative overflow-hidden pb-24 ${theme.pageBackground}`}>
          <div className="relative h-[60vh] w-full overflow-hidden md:h-[70vh]">
            <Image src={heroImage} alt={headline} fill sizes="100vw" className="object-cover" priority />
            <div className={`absolute inset-0 ${theme.heroGradient}`} />
          </div>
          <div className="relative z-10 mx-auto -mt-28 max-w-4xl px-6">
            <motion.div
              initial={motionInitial(motionReady, { opacity: 0, y: 40 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className={`border ${tokens.surfaceBorder} ${tokens.surface} px-8 py-12 shadow-2xl md:px-16 md:py-16 ${heroAlignText}`}
            >
              <h1 className={`mb-8 ${heroHeadlineClasses} ${theme.headingFont} ${theme.textPrimary}`}>
                {headline}
              </h1>
              {renderHeroSub(theme.textSecondary, variant.heroAlign === 'center')}
              {ctaButton}
            </motion.div>
          </div>
        </section>
      );

    case 'stacked':
      return (
        <section key="hero" className={`relative overflow-hidden pt-32 ${theme.pageBackground}`}>
          <div className={`mx-auto mb-16 max-w-4xl px-6 ${heroAlignText}`}>
            {brandName && (
              <motion.p
                initial={motionInitial(motionReady, { opacity: 0, y: 20 })}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className={`mb-6 text-sm uppercase tracking-[0.3em] ${theme.accentColor} font-bold`}
              >
                {brandName}
              </motion.p>
            )}
            <motion.h1
              initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className={`mb-10 ${heroHeadlineClasses} ${theme.headingFont} ${theme.textPrimary}`}
            >
              {headline}
            </motion.h1>
            {renderHeroSub(theme.textSecondary, variant.heroAlign === 'center')}
            {ctaButton && (
              <motion.div
                initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              >
                {ctaButton}
              </motion.div>
            )}
          </div>
          <div className="relative h-[42vh] w-full overflow-hidden md:h-[56vh]">
            <Image src={heroImage} alt={headline} fill sizes="100vw" className="object-cover" priority />
          </div>
        </section>
      );

    case 'duotone':
      return (
        <section key="hero" className="relative flex min-h-[90vh] items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image src={heroImage} alt={headline} fill sizes="100vw" className="object-cover" priority />
            <div className={`absolute inset-0 ${tokens.accentBg} opacity-30 mix-blend-multiply`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />
          </div>
          <div className={`relative z-10 mx-auto max-w-5xl px-6 ${heroAlignText}`}>
            {brandName && (
              <motion.p
                initial={motionInitial(motionReady, { opacity: 0, y: 20 })}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className={`mb-6 text-sm uppercase tracking-[0.3em] font-bold text-white/80 ${variant.heroAlign === 'center' ? 'mx-auto' : ''}`}
              >
                {brandName}
              </motion.p>
            )}
            <motion.h1
              initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className={`mb-8 ${heroHeadlineClasses} ${theme.headingFont} text-white`}
            >
              {headline}
            </motion.h1>
            {renderHeroSub('text-white/85', variant.heroAlign === 'center')}
            {ctaButton && (
              <motion.div
                initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              >
                {ctaButton}
              </motion.div>
            )}
          </div>
        </section>
      );

    case 'diptych':
      return (
        <section key="hero" className={`relative overflow-hidden ${theme.pageBackground}`}>
          <div className="grid min-h-[88vh] grid-cols-2">
            <div className="relative">
              <Image src={heroImage} alt={headline} fill sizes="50vw" className="object-cover" priority />
            </div>
            <div className="relative">
              <Image src={heroImage} alt={headline} fill sizes="50vw" className="object-cover scale-x-[-1]" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center px-6 pt-24 pb-12 sm:pt-28">
            <motion.div
              initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className={`max-w-xl border ${tokens.surfaceBorder} ${tokens.surface} px-10 py-12 text-center shadow-2xl md:px-14 md:py-16`}
            >
              <div className="mb-6 flex justify-center">{renderOrnament(true)}</div>
              <h1 className={`mb-6 ${heroHeadlineClasses} ${theme.headingFont} ${theme.textPrimary}`}>
                {headline}
              </h1>
              {renderHeroSub(theme.textSecondary, true)}
              {ctaButton}
            </motion.div>
          </div>
        </section>
      );

    case 'ribbon':
      return (
        <section key="hero" className="relative flex min-h-[90vh] items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image src={heroImage} alt={headline} fill sizes="100vw" className="object-cover" priority />
            <div className="absolute inset-0 bg-black/30" />
          </div>
          <div className="relative z-10 w-full">
            <motion.div
              initial={motionInitial(motionReady, { opacity: 0, x: -40 })}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className={`${tokens.accentBg} ${tokens.accentText} inline-block max-w-3xl px-8 py-8 md:px-16 md:py-12`}
            >
              <h1 className={`${heroHeadlineClasses} ${theme.headingFont}`}>
                {headline}
              </h1>
            </motion.div>
            <div className="px-8 pt-8 md:px-16">
              {renderHeroSub('text-white/90', false)}
              {ctaButton && (
                <motion.div
                  initial={motionInitial(motionReady, { opacity: 0, y: 20 })}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.45, ease: "easeOut" }}
                >
                  {ctaButton}
                </motion.div>
              )}
            </div>
          </div>
        </section>
      );

    case 'portrait':
      return (
        <section key="hero" className={`relative overflow-hidden py-16 ${theme.pageBackground}`}>
          <div className="mx-auto max-w-3xl px-6">
            <div className="relative aspect-[3/4] w-full overflow-hidden md:aspect-[4/5]">
              <Image src={heroImage} alt={headline} fill sizes="(max-width: 768px) 100vw, 48rem" className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8 text-center md:p-12">
                <motion.h1
                  initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                  className={`mb-6 ${heroHeadlineClasses} ${theme.headingFont} text-white`}
                >
                  {headline}
                </motion.h1>
                {renderHeroSub('text-white/85', true)}
                {ctaButton && (
                  <motion.div
                    initial={motionInitial(motionReady, { opacity: 0, y: 20 })}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.45, ease: "easeOut" }}
                  >
                    {ctaButton}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </section>
      );

    case 'masthead':
      return (
        <section key="hero" className={`relative overflow-hidden pt-28 ${theme.pageBackground}`}>
          <div className="mx-auto max-w-6xl px-6">
            <motion.div
              initial={motionInitial(motionReady, { opacity: 0, y: 20 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className={`flex items-center justify-between border-y-2 ${tokens.surfaceBorder} py-3`}
            >
              {brandName && (
                <span className={`text-xs uppercase tracking-[0.3em] font-bold ${theme.accentColor}`}>
                  {brandName}
                </span>
              )}
              <span className={`text-xs uppercase tracking-[0.3em] ${theme.textSecondary}`}>
                Est. Quality
              </span>
            </motion.div>
            <motion.h1
              initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className={`mx-auto my-10 max-w-4xl text-center ${heroHeadlineClasses} ${theme.headingFont} ${theme.textPrimary}`}
            >
              {headline}
            </motion.h1>
            <div className="mb-10 text-center">
              {renderHeroSub(theme.textSecondary, true)}
              {ctaButton}
            </div>
          </div>
          <div className="relative h-[44vh] w-full overflow-hidden md:h-[58vh]">
            <Image src={heroImage} alt={headline} fill sizes="100vw" className="object-cover" priority />
          </div>
        </section>
      );

    case 'canvas':
      return (
        <section key="hero" className={`relative overflow-hidden pt-40 pb-28 ${theme.pageBackground}`}>
          <div className="mx-auto max-w-4xl px-6 text-center">
            <motion.div
              initial={motionInitial(motionReady, { opacity: 0, scale: 0.9 })}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
              className="relative mx-auto mb-12 aspect-square w-32 overflow-hidden rounded-full md:w-40"
            >
              <Image src={heroImage} alt={headline} fill sizes="10rem" className="object-cover" priority />
            </motion.div>
            <div className="mb-6 flex justify-center">{renderOrnament(true)}</div>
            <motion.h1
              initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className={`mx-auto mb-10 max-w-3xl ${heroHeadlineClasses} ${theme.headingFont} ${theme.textPrimary}`}
            >
              {headline}
            </motion.h1>
            {renderHeroSub(theme.textSecondary, true)}
            {ctaButton && (
              <motion.div
                initial={motionInitial(motionReady, { opacity: 0, y: 20 })}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.45, ease: "easeOut" }}
              >
                {ctaButton}
              </motion.div>
            )}
          </div>
        </section>
      );

    case 'cinematic':
    default:
      return (
        <section key="hero" className="relative flex min-h-[90vh] items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image src={heroImage} alt={headline} fill sizes="100vw" className="object-cover" priority />
            <div className={`absolute inset-0 ${theme.heroGradient}`} />
          </div>
          <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
            <motion.h1
              initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className={`mb-8 ${heroHeadlineClasses} ${theme.headingFont} text-white`}
            >
              {headline}
            </motion.h1>
            {renderHeroSub('text-white/85', true)}
            {ctaButton && (
              <motion.div
                initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              >
                {ctaButton}
              </motion.div>
            )}
          </div>
        </section>
      );
  }
}
