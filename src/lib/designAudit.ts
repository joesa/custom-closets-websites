/**
 * Design Quality Audit — Automated checks to ensure rendered client sites
 * adhere to Lumina-level design standards and are free of AI tell-words.
 */

import { AI_TELL_PHRASES, findAiTellPhrases } from './humanCopyVoice';

export interface QualityReport {
  score: number; // 0 - 100
  passed: boolean; // score >= 80 and no critical errors
  checks: {
    name: string;
    passed: boolean;
    scoreContribution: number;
    details: string;
  }[];
  bannedWordsFound: string[];
  warnings: string[];
}

/**
 * Renderer-only additions on top of the shared humanCopyVoice ban table.
 * "solutions" is too broad for generated marketing copy at large (the shared
 * table bans the telly "tailored solutions") but in custom-mode HTML — the only
 * thing this audit scans — bare "solutions" is reliably filler.
 */
const RENDERER_EXTRA_TELLS = ['solutions'];

export const BANNED_AI_TELLS = [...AI_TELL_PHRASES, ...RENDERER_EXTRA_TELLS];

export function auditDesignQuality(html: string, css: string = ''): QualityReport {
  const combined = `${html} ${css}`.toLowerCase();
  const checks: QualityReport['checks'] = [];
  const warnings: string[] = [];
  const bannedWordsFound: string[] = [];

  // Check 1: AI Tell-Words Ban (Critical). The shared table is rule-aware
  // (word boundaries, narrow trade exemptions like "seamless gutters");
  // renderer-only extras are plain substring bans.
  bannedWordsFound.push(
    ...new Set(findAiTellPhrases(combined).map((hit) => hit.toLowerCase()))
  );
  for (const word of RENDERER_EXTRA_TELLS) {
    if (combined.includes(word.toLowerCase())) {
      bannedWordsFound.push(word);
    }
  }
  const noBannedWords = bannedWordsFound.length === 0;
  checks.push({
    name: 'AI Tell-Words Ban',
    passed: noBannedWords,
    scoreContribution: 25,
    details: noBannedWords
      ? 'Clean copy — no banned AI cliche words detected.'
      : `Found ${bannedWordsFound.length} banned AI word(s): ${bannedWordsFound.join(', ')}.`,
  });

  // Check 2: Eyebrow Label Typography (Lumina trait)
  const hasEyebrows =
    /ds-eyebrow|letter-spacing:\s*0\.2|tracking-\[0\.2|uppercase.*tracking/i.test(combined);
  checks.push({
    name: 'Eyebrow Typography',
    passed: hasEyebrows,
    scoreContribution: 15,
    details: hasEyebrows
      ? 'Eyebrow label structure present.'
      : 'Missing micro-detail eyebrow labels.',
  });

  // Check 3: Hairline Dividers (Lumina trait)
  const hasHairlines =
    /ds-hairline|rgba\(.*0\.1[0-9]\)|border-b border-\w+\/\d+/i.test(combined);
  checks.push({
    name: 'Hairline Divider System',
    passed: hasHairlines,
    scoreContribution: 15,
    details: hasHairlines
      ? 'Subtle hairline borders and section dividers present.'
      : 'Missing subtle hairline dividers.',
  });

  // Check 4: Specific Numbers & Specifications (Craft voice)
  const hasSpecifics =
    /\b\d+[\s-]*(wks?|weeks?|days?|hrs?|hours?|yrs?|years?|tolerance|warrant|mm|inch|in|ft|feet|sq\s*ft)\b/i.test(
      combined
    ) || /\b(job|spec|as-built)\b/i.test(combined);
  checks.push({
    name: 'Specific Craft & Spec Copy',
    passed: hasSpecifics,
    scoreContribution: 20,
    details: hasSpecifics
      ? 'Specific measurements, job numbers, or timeline details found.'
      : 'Copy lacks concrete numerical specs or process details.',
  });

  // Check 5: Material Palette & Custom Properties
  const hasCssVars =
    /--ds-surface|--ds-ink|--ds-accent|var\(--ds-/i.test(combined);
  checks.push({
    name: 'CSS Custom Property Tokens',
    passed: hasCssVars,
    scoreContribution: 15,
    details: hasCssVars
      ? 'Consuming design system CSS custom properties.'
      : 'Not using CSS custom property tokens.',
  });

  // Check 6: Section Padding Rhythm
  const hasGenerousRhythm =
    /py-24|py-32|ds-section|padding-top:\s*(96|110|120)px/i.test(combined);
  checks.push({
    name: 'Airy Section Rhythm',
    passed: hasGenerousRhythm,
    scoreContribution: 10,
    details: hasGenerousRhythm
      ? 'Generous section padding (96px+) present.'
      : 'Section padding is cramped (<96px).',
  });

  const totalScore = checks.reduce(
    (acc, check) => acc + (check.passed ? check.scoreContribution : 0),
    0
  );
  const passed = totalScore >= 75 && noBannedWords;

  if (!noBannedWords) {
    warnings.push(`Remove AI tell-words: ${bannedWordsFound.join(', ')}`);
  }
  if (!hasSpecifics) {
    warnings.push('Add specific numbers (e.g. 6-8 weeks, 1/4" survey, Job 24-0619).');
  }

  return {
    score: totalScore,
    passed,
    checks,
    bannedWordsFound,
    warnings,
  };
}
