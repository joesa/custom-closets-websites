/**
 * Positive design-quality audit for generated custom sites.
 *
 * This deliberately measures craft rather than a house style. Older versions
 * awarded points for Lumina-specific tells (eyebrows, hairlines and 96px
 * padding), which encouraged unrelated businesses to converge on the same
 * design. The universal checks below apply to every direction; the final check
 * asks only whether the chosen art direction is expressed coherently.
 */

import { AI_TELL_PHRASES, findAiTellPhrases } from './humanCopyVoice';

export type DesignArchetype =
  | 'editorial'
  | 'cinematic'
  | 'catalog'
  | 'playful'
  | 'quiet'
  | 'utility';

export interface DesignAuditOptions {
  /** Optional locked direction. When omitted the strongest visible direction wins. */
  archetype?: DesignArchetype;
}

export interface QualityReport {
  score: number;
  passed: boolean;
  archetype: DesignArchetype;
  checks: {
    name: string;
    passed: boolean;
    scoreContribution: number;
    details: string;
  }[];
  bannedWordsFound: string[];
  warnings: string[];
}

const RENDERER_EXTRA_TELLS = ['solutions'];
export const BANNED_AI_TELLS = [...AI_TELL_PHRASES, ...RENDERER_EXTRA_TELLS];

type ArchetypeEvidence = { archetype: DesignArchetype; signals: string[] };

function countMatches(input: string, pattern: RegExp): number {
  return Array.from(input.matchAll(pattern)).length;
}

function evidenceForArchetypes(html: string, css: string): ArchetypeEvidence[] {
  const source = `${html}\n${css}`;
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const sectionCount = countMatches(html, /<section\b/gi);
  const headingCount = countMatches(html, /<h[1-6]\b/gi);
  const imageCount = countMatches(html, /<img\b/gi);

  return [
    {
      archetype: 'editorial',
      signals: [
        /column-count|columns\s*:/i.test(css) ? 'multi-column reading rhythm' : '',
        /font-family[^;}]*(?:serif|Garamond|Baskerville|Caslon|Newsreader|Lora)/i.test(css)
          ? 'editorial type voice'
          : '',
        /border-(?:top|bottom)|<hr\b/i.test(source) ? 'rule-based hierarchy' : '',
        /grid-template-columns\s*:\s*(?:minmax|[^;}]*(?:2fr|3fr))/i.test(css)
          ? 'asymmetric grid'
          : '',
      ].filter(Boolean),
    },
    {
      archetype: 'cinematic',
      signals: [
        /min-height\s*:\s*(?:[7-9]\d|100)(?:vh|svh|dvh)/i.test(css)
          ? 'viewport-scale composition'
          : '',
        /position\s*:\s*absolute/i.test(css) && imageCount > 0 ? 'layered image composition' : '',
        /object-fit\s*:\s*cover/i.test(css) ? 'image-led crop system' : '',
        /(?:linear-gradient|color-mix)\([^;}]*(?:transparent|rgba)/i.test(css)
          ? 'legibility scrim'
          : '',
      ].filter(Boolean),
    },
    {
      archetype: 'catalog',
      signals: [
        /grid-template-columns\s*:\s*repeat\(/i.test(css) ? 'repeatable catalog grid' : '',
        /<ul\b|<ol\b|<dl\b/i.test(html) ? 'structured item data' : '',
        headingCount >= 5 ? 'dense labeled hierarchy' : '',
        sectionCount >= 5 && text.length >= 700 ? 'information-rich composition' : '',
      ].filter(Boolean),
    },
    {
      archetype: 'playful',
      signals: [
        /border-radius\s*:\s*(?:[2-9]\d|\d{3,})px/i.test(css) ? 'expressive geometry' : '',
        /transform\s*:\s*(?:rotate|skew)/i.test(css) ? 'irregular placement' : '',
        /clip-path|border-radius[^;}]*%/i.test(css) ? 'shaped imagery' : '',
        countMatches(css, /#[0-9a-f]{6}\b/gi) >= 6 ? 'expanded color vocabulary' : '',
      ].filter(Boolean),
    },
    {
      archetype: 'quiet',
      signals: [
        sectionCount > 0 && sectionCount <= 5 ? 'restrained section count' : '',
        /max-width\s*:\s*(?:5[5-9]|6\d|7[0-2])ch/i.test(css) ? 'controlled reading measure' : '',
        /clamp\([^)]*(?:4rem|5rem|6rem|8vw|10vw)/i.test(css) ? 'deliberate negative space' : '',
        countMatches(css, /box-shadow\s*:/gi) <= 1 ? 'restrained elevation' : '',
      ].filter(Boolean),
    },
    {
      archetype: 'utility',
      signals: [
        /href=["']tel:/i.test(html) ? 'immediate phone action' : '',
        /position\s*:\s*sticky/i.test(css) ? 'persistent action chrome' : '',
        /font-weight\s*:\s*(?:600|700|800|900|bold)/i.test(css) ? 'decisive hierarchy' : '',
        /border\s*:\s*(?:1|2|3)px\s+solid/i.test(css) ? 'durable surface language' : '',
      ].filter(Boolean),
    },
  ];
}

function resolveArchetype(
  evidence: ArchetypeEvidence[],
  requested?: DesignArchetype
): ArchetypeEvidence {
  if (requested) {
    return evidence.find((entry) => entry.archetype === requested) ?? evidence[0];
  }
  return evidence.reduce((best, entry) =>
    entry.signals.length > best.signals.length ? entry : best
  );
}

export function auditDesignQuality(
  html: string,
  css = '',
  options: DesignAuditOptions = {}
): QualityReport {
  const combined = `${html} ${css}`.toLowerCase();
  const checks: QualityReport['checks'] = [];
  const warnings: string[] = [];
  const bannedWordsFound = [
    ...new Set(findAiTellPhrases(combined).map((hit) => hit.toLowerCase())),
  ];
  for (const word of RENDERER_EXTRA_TELLS) {
    if (combined.includes(word) && !bannedWordsFound.includes(word)) bannedWordsFound.push(word);
  }

  const addCheck = (
    name: string,
    passed: boolean,
    scoreContribution: number,
    passDetail: string,
    failDetail: string
  ) => {
    checks.push({
      name,
      passed,
      scoreContribution,
      details: passed ? passDetail : failDetail,
    });
    if (!passed) warnings.push(failDetail);
  };

  addCheck(
    'Human, specific copy',
    bannedWordsFound.length === 0,
    25,
    'Copy is free of the platform AI-tell list.',
    `Remove AI tell-words: ${bannedWordsFound.join(', ') || 'unknown'}.`
  );

  const customProps = countMatches(css, /--[a-z][\w-]*\s*:/gi);
  const tokenUses = countMatches(css, /var\(--[a-z][\w-]*\)/gi);
  addCheck(
    'Coherent design system',
    customProps >= 5 && tokenUses >= 3,
    15,
    'A reusable token system controls the visual language.',
    'Define at least five meaningful design tokens and consume them throughout the CSS.'
  );

  const hasResponsiveContract = /@media\s*\([^)]*(?:max|min)-width/i.test(css);
  const hasFluidSizing = /clamp\(|min\(|max\(/i.test(css);
  addCheck(
    'Responsive composition',
    hasResponsiveContract && hasFluidSizing,
    15,
    'The composition has both breakpoint and fluid behavior.',
    'Add a real breakpoint plus fluid sizing so mobile is intentionally composed.'
  );

  const hasFocus = /:focus(?:-visible|-within)?/i.test(css);
  const hasMotion = /@keyframes|animation\s*:|transition\s*:/i.test(css);
  const respectsReducedMotion = !hasMotion || /prefers-reduced-motion\s*:\s*reduce/i.test(css);
  addCheck(
    'Interaction craft',
    hasFocus && respectsReducedMotion,
    15,
    'Keyboard focus and motion preferences are handled.',
    'Provide visible keyboard focus and disable nonessential motion for reduced-motion users.'
  );

  const hasConcreteDetail =
    /\b\d+[\s-]*(?:minutes?|hours?|days?|weeks?|years?|inches?|feet|ft|sq\.?\s*ft|miles?)\b/i.test(combined) ||
    /\b(?:material|finish|warranty|service area|licensed|insured|appointment|installation)\b/i.test(combined);
  addCheck(
    'Business-specific substance',
    hasConcreteDetail,
    15,
    'The page includes concrete operational or craft detail.',
    'Add a truthful material, process, timing, location, or service detail from the intake.'
  );

  const direction = resolveArchetype(evidenceForArchetypes(html, css), options.archetype);
  addCheck(
    `${direction.archetype[0].toUpperCase()}${direction.archetype.slice(1)} direction`,
    direction.signals.length >= 2,
    15,
    `The direction is expressed through ${direction.signals.join(' and ')}.`,
    `The ${direction.archetype} direction needs at least two structural signals; color or copy alone is not art direction.`
  );

  const score = checks.reduce(
    (sum, check) => sum + (check.passed ? check.scoreContribution : 0),
    0
  );

  return {
    score,
    passed: score >= 80 && bannedWordsFound.length === 0,
    archetype: direction.archetype,
    checks,
    bannedWordsFound,
    warnings,
  };
}
