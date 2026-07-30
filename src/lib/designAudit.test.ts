import { describe, it, expect } from 'vitest';
import { auditDesignQuality, BANNED_AI_TELLS } from './designAudit';

describe('auditDesignQuality', () => {
  it('passes on Lumina-style HTML and CSS', () => {
    const html = `
      <section class="py-24">
        <p class="ds-eyebrow">Method</p>
        <h2>Three visits. No third-party crews.</h2>
        <p>Job 24-0619 survey tolerance 1/4 inch in 6-8 weeks.</p>
      </section>
    `;
    const css = `
      :root {
        --ds-surface: #f6f2ec;
        --ds-ink: #241f1a;
        --ds-accent: #8a7256;
        --ds-hair: rgba(36,31,26,0.14);
      }
    `;

    const report = auditDesignQuality(html, css);
    expect(report.passed).toBe(true);
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.bannedWordsFound).toHaveLength(0);
  });

  it('catches banned AI tell-words', () => {
    const html = `
      <h1>We offer cutting-edge solutions for your home</h1>
      <p>We leverage state-of-the-art technology.</p>
    `;

    const report = auditDesignQuality(html);
    expect(report.passed).toBe(false);
    expect(report.bannedWordsFound).toContain('solutions');
    expect(report.bannedWordsFound).toContain('leverage');
    expect(report.bannedWordsFound).toContain('cutting-edge');
    expect(report.bannedWordsFound).toContain('state-of-the-art');
  });
});
