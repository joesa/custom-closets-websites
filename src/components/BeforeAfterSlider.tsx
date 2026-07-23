'use client';

import React, { useState, useRef, useEffect, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import Image from 'next/image';
import * as motion from 'framer-motion/client';
import { BeforeAfterConfig, ThemeType } from '@/types/config';
import { getThemeStyles, getSectionTokens, applyVoice, ThemeTokenSelection } from '@/lib/theme';
import { useMotionHydrated } from '@/components/MotionHydrationProvider';
import { motionInitial } from '@/lib/motionInitial';

interface BeforeAfterSliderProps {
  config?: BeforeAfterConfig | null;
  theme: ThemeType;
  themeTokens?: ThemeTokenSelection | null;
  fontSeed?: string;
}

export default function BeforeAfterSlider({ config, theme, themeTokens, fontSeed }: BeforeAfterSliderProps) {
  const motionReady = useMotionHydrated();
  const [sliderPosition, setSliderPosition] = useState(68);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive styling from the central theme tokens so all 13 themes render with
  // the right palette/typography instead of falling back to luxury-minimal.
  const t = applyVoice(getThemeStyles(theme, themeTokens), theme, fontSeed ?? '', themeTokens);
  const section = getSectionTokens(theme, fontSeed ?? '', themeTokens);
  const activeStyles = {
    bg: t.pageBackground,
    title: `${t.headingFont} text-3xl md:text-5xl ${t.textPrimary}`,
    subtitle: `${t.bodyFont} text-xs uppercase tracking-widest ${section.accent} mb-8`,
    handleBg: `${section.accentBg} ${section.accentText} shadow-lg`,
    line: `${section.accentBg} shadow-lg`,
  };

  // Gentle first-paint hint so visitors discover the slider is interactive.
  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setSliderPosition(50);
      return;
    }
    const t1 = window.setTimeout(() => setSliderPosition(42), 700);
    const t2 = window.setTimeout(() => setSliderPosition(50), 1400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Calculate percentage (0 to 100)
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const onMouseMove = (e: ReactMouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const onTouchMove = (e: ReactTouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const startDragging = (clientX: number) => {
    setIsDragging(true);
    handleMove(clientX);
  };

  // Global mouse up event to stop dragging if they let go outside the container
  useEffect(() => {
    const onGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', onGlobalMouseUp);
    window.addEventListener('touchend', onGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', onGlobalMouseUp);
      window.removeEventListener('touchend', onGlobalMouseUp);
    };
  }, []);

  if (!config || !config.beforeImage || !config.afterImage) {
    return null;
  }

  return (
    <section className={`py-32 px-6 ${activeStyles.bg}`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.p 
            initial={motionInitial(motionReady, { opacity: 0, y: 20 })}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={activeStyles.subtitle}
          >
            {config.subtitle}
          </motion.p>
          <motion.h2 
            initial={motionInitial(motionReady, { opacity: 0, y: 20 })}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            className={activeStyles.title}
          >
            {config.title}
          </motion.h2>
        </div>

        <motion.div 
          initial={motionInitial(motionReady, { opacity: 0, scale: 0.98 })}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden select-none touch-none cursor-ew-resize group"
          ref={containerRef}
          onMouseDown={(e) => startDragging(e.clientX)}
          onTouchStart={(e) => startDragging(e.touches[0].clientX)}
          onMouseMove={onMouseMove}
          onTouchMove={onTouchMove}
        >
          {/* Base Layer: Before Image */}
          <div className="absolute inset-0">
            <Image 
              src={config.beforeImage}
              alt="Before"
              fill
              className="object-cover pointer-events-none"
              sizes="(max-width: 1152px) 100vw, 1152px"
            />
            <div className="absolute top-4 right-4 z-10 px-4 py-1 text-xs font-bold bg-black/60 text-white backdrop-blur-sm">
              Before
            </div>
          </div>

          {/* Top Layer: After Image, clipped */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <Image
              src={config.afterImage}
              alt="After Transformation"
              fill
              className="object-cover"
              sizes="(max-width: 1152px) 100vw, 1152px"
            />
            {/* Label */}
            <div className="absolute top-4 left-4 z-10 px-4 py-1 text-xs font-bold uppercase tracking-widest bg-white/90 text-black backdrop-blur-sm rounded-full">
              After
            </div>
          </div>

          {/* Slider Line & Handle */}
          <div 
            className={`absolute top-0 bottom-0 w-1 -ml-[2px] pointer-events-none ${activeStyles.line}`}
            style={{ left: `${sliderPosition}%` }}
          >
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-transform duration-200 ${isDragging ? 'scale-90' : 'group-hover:scale-110'} ${activeStyles.handleBg}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
                <polyline points="9 18 15 12 9 6" className="opacity-0"></polyline>
              </svg>
              <div className="absolute inset-0 flex items-center justify-between px-[10px]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
