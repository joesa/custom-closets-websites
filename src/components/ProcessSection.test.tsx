import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ProcessSection from './ProcessSection';
import type { ProcessConfig } from '@/types/config';

const PROCESS: ProcessConfig = {
  title: 'How a project moves',
  subtitle: 'Practical next steps',
  steps: [
    { number: '01', title: 'Connect', description: 'Tell us what you want to change.' },
    { number: '02', title: 'Scope', description: 'We confirm the work and price.' },
    { number: '03', title: 'Complete', description: 'We finish the agreed work.' },
  ],
};

describe('ProcessSection', () => {
  it('uses semantic order without rendering internal zero-padded step keys', () => {
    for (let seed = 0; seed < 32; seed += 1) {
      const html = renderToStaticMarkup(
        <ProcessSection theme="luxury-minimal" process={PROCESS} fontSeed={`process-${seed}`} />
      );

      expect(html).toContain('Connect');
      expect(html).toContain('Scope');
      expect(html).toContain('Complete');
      expect(html).not.toMatch(/>\s*0[1-3]\s*</);
      expect(html).not.toContain('ds-step-counter');
    }
  });
});
