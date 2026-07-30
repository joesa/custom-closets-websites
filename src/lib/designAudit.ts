/**
 * Design Quality Audit — Automated checks to ensure rendered client sites
 * adhere to Lumina-level design standards and are free of AI tell-words.
 */

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

export const BANNED_AI_TELLS = [
  'solutions',
  'leverage',
  'cutting-edge',
  'state-of-the-art',
  'comprehensive',
  'game-changer',
  'synergy',
  'streamline',
  'empower',
  'delve',
  'testament to',
  'nestled in',
  "in today's fast-paced world",
  'whether you need',
  'we are committed to',
  'our team of experienced professionals',
];

export function auditDesignQuality(html: string, css: string = ''): QualityReport {
  const combined = `${html} ${css}`.toLowerCase();
  const checks: QualityReport['checks'] = [];
  const warnings: string[] = [];
  const bannedWordsFound: string[] = [];

  // Check 1: AI Tell-Words Ban (Critical)
  for (const word of BANNED_AI_TELLS) {
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
