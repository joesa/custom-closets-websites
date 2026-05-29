'use client';

import React, { useState, useRef, useEffect, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { BeforeAfterConfig, ThemeType } from '@/types/config';

interface BeforeAfterSliderProps {
  config: BeforeAfterConfig;
  theme: ThemeType;
}

export default function BeforeAfterSlider({ config, theme }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Theme-specific styles
  const styles: Record<string, any> = {
    'luxury-minimal': {
      bg: 'bg-white',
      title: 'font-playfair text-3xl md:text-5xl text-stone-900',
      subtitle: 'font-sans text-xs uppercase tracking-widest text-stone-500 mb-8',
      handleBg: 'bg-white shadow-[0_0_20px_rgba(0,0,0,0.1)] text-stone-900',
      line: 'bg-white shadow-[0_0_10px_rgba(0,0,0,0.2)]',
    },
    'brutalist': {
      bg: 'bg-[#050505] border-y border-white/10',
      title: 'font-inter font-black text-3xl md:text-5xl uppercase tracking-tighter text-white',
      subtitle: 'font-inter text-sm uppercase tracking-widest text-yellow-400 mb-8 font-bold',
      handleBg: 'bg-yellow-400 text-black rounded-none shadow-[0_0_20px_rgba(250,204,21,0.3)]',
      line: 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]',
    },
    'classic-warm': {
      bg: 'bg-[#faf8f5]',
      title: 'font-lora text-3xl md:text-5xl text-amber-950',
      subtitle: 'font-sans text-sm tracking-widest text-amber-900/60 mb-8 uppercase',
      handleBg: 'bg-[#faf8f5] shadow-xl border border-amber-900/10 text-amber-900',
      line: 'bg-white shadow-lg border-l border-amber-900/10',
    }
  };

  const activeStyles = styles[theme] || styles['luxury-minimal'];

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
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={activeStyles.subtitle}
          >
            {config.subtitle}
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            className={activeStyles.title}
          >
            {config.title}
          </motion.h2>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
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
              alt="Before Transformation"
              fill
              className="object-cover pointer-events-none"
              sizes="100vw"
            />
            {/* Label */}
            <div className={`absolute top-4 right-4 z-10 px-4 py-1 text-xs font-bold uppercase tracking-widest bg-black/60 text-white backdrop-blur-sm ${theme === 'brutalist' ? 'rounded-none border border-white/10' : 'rounded-full'}`}>
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
              sizes="100vw"
            />
            {/* Label */}
            <div className={`absolute top-4 left-4 z-10 px-4 py-1 text-xs font-bold uppercase tracking-widest bg-white/90 text-black backdrop-blur-sm ${theme === 'brutalist' ? 'rounded-none border-b-2 border-yellow-400' : 'rounded-full'}`}>
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
