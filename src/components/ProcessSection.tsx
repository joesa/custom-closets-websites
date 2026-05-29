'use client';

import React from 'react';
import * as motion from 'framer-motion/client';
import { ProcessConfig, ThemeType } from '@/types/config';

interface ProcessSectionProps {
  theme: ThemeType;
  process: ProcessConfig;
}

export default function ProcessSection({ theme, process }: ProcessSectionProps) {
  // Theme-specific styling tokens
  const styles: Record<string, any> = {
    'luxury-minimal': {
      bg: 'bg-white',
      titleFont: 'font-playfair tracking-wide text-stone-900',
      stepNum: 'font-playfair text-amber-600/30 font-light',
      stepTitle: 'font-playfair text-stone-800 tracking-tight',
      descFont: 'font-sans text-stone-500 font-light leading-relaxed',
    },
    'brutalist': {
      bg: 'bg-[#050505] border-t border-white/10',
      titleFont: 'font-inter font-black tracking-tighter text-white uppercase md:text-5xl',
      stepNum: 'font-inter font-black text-white/10 text-6xl block mb-2',
      stepTitle: 'font-inter font-bold text-yellow-400 uppercase tracking-wide',
      descFont: 'font-sans text-slate-400 text-sm leading-relaxed',
    },
    'classic-warm': {
      bg: 'bg-[#faf8f5]',
      titleFont: 'font-lora font-semibold text-amber-950 text-4xl md:text-5xl',
      stepNum: 'font-lora font-bold text-amber-900/10 text-6xl',
      stepTitle: 'font-lora font-medium text-amber-900',
      descFont: 'font-sans text-amber-900/70 text-base leading-relaxed',
    }
  };

  const activeStyles = styles[theme] || styles['luxury-minimal'];

  return (
    <section className={`py-32 px-6 ${activeStyles.bg}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className={`text-3xl md:text-5xl ${activeStyles.titleFont}`}>
            {process.title}
          </h2>
          <p className="text-sm tracking-widest uppercase mt-4 opacity-60">
            {process.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
          {process.steps.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: idx * 0.2 }}
              className="relative flex flex-col group"
            >
              <div className={`text-6xl md:text-7xl ${activeStyles.stepNum}`}>
                {step.number}
              </div>
              <h3 className={`text-2xl mt-4 mb-4 ${activeStyles.stepTitle}`}>
                {step.title}
              </h3>
              <p className={activeStyles.descFont}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
