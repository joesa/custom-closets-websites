'use client';

import React from 'react';
import * as motion from 'framer-motion/client';
import { ProcessConfig, ThemeType } from '@/types/config';
import { getThemeStyles, getSectionTokens } from '@/lib/theme';
import { useMotionHydrated } from '@/components/MotionHydrationProvider';
import { motionInitial } from '@/lib/motionInitial';

interface ProcessSectionProps {
  theme: ThemeType;
  process: ProcessConfig;
}

export default function ProcessSection({ theme, process }: ProcessSectionProps) {
  const motionReady = useMotionHydrated();
  // Derive styling from the central theme tokens so all 13 themes render with
  // their own palette/typography (instead of falling back to luxury-minimal).
  const t = getThemeStyles(theme);
  const section = getSectionTokens(theme);

  return (
    <section className={`py-32 px-6 ${t.pageBackground}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className={`text-3xl md:text-5xl ${t.headingFont} ${t.textPrimary}`}>
            {process.title}
          </h2>
          <p className={`text-sm tracking-widest uppercase mt-4 ${t.textSecondary}`}>
            {process.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
          {process.steps.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: idx * 0.2 }}
              className="relative flex flex-col group"
            >
              <div className={`text-6xl md:text-7xl font-bold opacity-15 ${section.accent} ${t.headingFont}`}>
                {step.number}
              </div>
              <h3 className={`text-2xl mt-4 mb-4 ${t.headingFont} ${t.textPrimary}`}>
                {step.title}
              </h3>
              <p className={`leading-relaxed ${t.bodyFont} ${t.textSecondary}`}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
