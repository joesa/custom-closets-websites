'use client';

import * as motion from 'framer-motion/client';
import type { SocialProofConfig, ThemeType } from '@/types/config';
import { applyVoice, getSectionTokens, getThemeStyles, type ThemeTokenSelection } from '@/lib/theme';
import { getSiteMotion, motionRise } from '@/lib/siteMotion';
import { useMotionHydrated } from '@/components/MotionHydrationProvider';

interface SocialProofSectionProps {
  config: SocialProofConfig;
  theme: ThemeType;
  themeTokens?: ThemeTokenSelection | null;
  fontSeed: string;
}

export default function SocialProofSection({
  config,
  theme,
  themeTokens,
  fontSeed,
}: SocialProofSectionProps) {
  const motionReady = useMotionHydrated();
  const siteMotion = getSiteMotion(fontSeed);
  const t = applyVoice(getThemeStyles(theme, themeTokens), theme, fontSeed, themeTokens);
  const section = getSectionTokens(theme, fontSeed, themeTokens);
  const testimonials = config.testimonials?.filter((x) => x.quote?.trim()) || [];
  const stats = config.stats?.filter((x) => x.value?.trim() && x.label?.trim()) || [];

  if (!testimonials.length && !stats.length) return null;

  return (
    <section className={`px-6 py-24 ${t.pageBackground}`}>
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={motionRise(siteMotion, motionReady)}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={siteMotion.section}
          className="mb-14 text-center"
        >
          <p className={`mb-3 text-sm uppercase tracking-[0.2em] ${section.accent}`}>
            {config.eyebrow?.trim() || 'Trusted locally'}
          </p>
          <h2 className={`text-3xl md:text-5xl ${t.headingFont} ${t.textPrimary}`}>
            {config.headline?.trim() || 'Homeowners who already made the switch'}
          </h2>
        </motion.div>

        {stats.length > 0 && (
          <div className="mb-14 grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={`${stat.label}-${i}`}
                initial={motionRise(siteMotion, motionReady)}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ ...siteMotion.section, delay: 0.05 * i }}
                className="text-center"
              >
                <div className={`text-3xl md:text-4xl font-semibold ${t.headingFont} ${t.textPrimary}`}>
                  {stat.value}
                </div>
                <div className={`mt-1 text-sm ${t.textSecondary}`}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        )}

        {testimonials.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((item, i) => (
              <motion.blockquote
                key={`${item.name}-${i}`}
                initial={motionRise(siteMotion, motionReady)}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ ...siteMotion.section, delay: 0.08 * i }}
                className={`rounded-2xl border p-6 ${section.surface} ${section.surfaceBorder}`}
              >
                <p className={`text-base leading-relaxed ${t.textPrimary}`}>“{item.quote}”</p>
                <footer className={`mt-5 text-sm ${t.textSecondary}`}>
                  <span className={`font-semibold ${t.textPrimary}`}>{item.name}</span>
                  {item.role ? <span> · {item.role}</span> : null}
                </footer>
              </motion.blockquote>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
