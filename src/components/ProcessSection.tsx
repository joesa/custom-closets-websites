'use client';

import React from 'react';
import * as motion from 'framer-motion/client';
import { ProcessConfig, ThemeType } from '@/types/config';
import { getThemeStyles, getSectionTokens, applyVoice, ThemeTokenSelection } from '@/lib/theme';
import { useMotionHydrated } from '@/components/MotionHydrationProvider';
import { motionInitial } from '@/lib/motionInitial';
import { hashSeed } from '@/lib/designVariants';

interface ProcessSectionProps {
  theme: ThemeType;
  themeTokens?: ThemeTokenSelection | null;
  process: ProcessConfig;
  fontSeed?: string;
}

type ProcessLayout = 'columns' | 'timeline' | 'stacked';

function resolveLayout(seed?: string): ProcessLayout {
  const layouts: ProcessLayout[] = ['columns', 'timeline', 'stacked'];
  return layouts[hashSeed(`${seed || 'process'}::layout`) % layouts.length];
}

export default function ProcessSection({ theme, themeTokens, process, fontSeed }: ProcessSectionProps) {
  const motionReady = useMotionHydrated();
  const t = applyVoice(getThemeStyles(theme, themeTokens), theme, fontSeed ?? '', themeTokens);
  const section = getSectionTokens(theme, fontSeed ?? '', themeTokens);
  const layout = resolveLayout(fontSeed);

  return (
    <section className={`py-24 md:py-32 px-6 ${t.pageBackground}`}>
      <div className="max-w-7xl mx-auto">
        <div className={`${layout === 'stacked' ? 'text-left max-w-3xl' : 'text-center'} mb-16 md:mb-24`}>
          <h2 className={`text-3xl md:text-5xl ${t.headingFont} ${t.textPrimary}`}>
            {process.title}
          </h2>
          {process.subtitle ? (
            <p className={`text-sm mt-4 ${t.textSecondary}`}>{process.subtitle}</p>
          ) : null}
        </div>

        {layout === 'timeline' ? (
          <div className="max-w-3xl mx-auto space-y-0 border-l border-black/10 dark:border-white/10 pl-8">
            {process.steps.map((step, idx) => (
              <motion.div
                key={`${idx}-${step.number}`}
                initial={motionInitial(motionReady, { opacity: 0, y: 20 })}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: idx * 0.12 }}
                className="relative pb-12 last:pb-0"
              >
                <span
                  className={`absolute -left-[2.4rem] top-1 h-4 w-4 rounded-full border-2 ${section.accentBg} border-current`}
                />
                <p className={`text-xs mb-2 ${section.accent}`}>{step.number}</p>
                <h3 className={`text-xl md:text-2xl mb-2 ${t.headingFont} ${t.textPrimary}`}>
                  {step.title}
                </h3>
                <p className={`leading-relaxed ${t.bodyFont} ${t.textSecondary}`}>{step.description}</p>
              </motion.div>
            ))}
          </div>
        ) : layout === 'stacked' ? (
          <div className="max-w-3xl space-y-10">
            {process.steps.map((step, idx) => (
              <motion.div
                key={`${idx}-${step.number}`}
                initial={motionInitial(motionReady, { opacity: 0, y: 20 })}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="flex gap-6 items-start"
              >
                <span className={`text-2xl shrink-0 ${section.accent} ${t.headingFont}`}>{step.number}</span>
                <div>
                  <h3 className={`text-xl md:text-2xl mb-2 ${t.headingFont} ${t.textPrimary}`}>
                    {step.title}
                  </h3>
                  <p className={`leading-relaxed ${t.bodyFont} ${t.textSecondary}`}>{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 relative">
            {process.steps.map((step, idx) => (
              <motion.div
                key={`${idx}-${step.number}`}
                initial={motionInitial(motionReady, { opacity: 0, y: 30 })}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.8, delay: idx * 0.2 }}
                className="relative flex flex-col group"
              >
                <div className={`text-5xl md:text-6xl font-bold opacity-15 ${section.accent} ${t.headingFont}`}>
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
        )}
      </div>
    </section>
  );
}
