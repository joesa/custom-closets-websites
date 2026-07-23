'use client';

import * as motion from 'framer-motion/client';
import { useMotionHydrated } from '@/components/MotionHydrationProvider';
import { motionInitial } from '@/lib/motionInitial';

const PLATFORM_URL = 'https://www.closetquotes.com/get-started';

/**
 * Sticky conversion bar shown only on shared-demo aesthetic sites
 * (Lumina / Ironclad / Hearth). Turns “pretty template” into a signup path.
 */
export default function DemoPlatformCta({ brandName }: { brandName: string }) {
  const motionReady = useMotionHydrated();

  return (
    <motion.div
      initial={motionInitial(motionReady, { opacity: 0, y: 24 })}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
      className="fixed bottom-0 inset-x-0 z-[60] border-t border-black/10 bg-[#0a0a0a]/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-stretch gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-center text-sm text-white/85 sm:text-left">
          Love the look of <span className="font-semibold text-white">{brandName}</span>?
          {' '}Get a site like this — with the quote engine built in.
        </p>
        <a
          href={PLATFORM_URL}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-slate-100"
        >
          Start free →
        </a>
      </div>
    </motion.div>
  );
}
