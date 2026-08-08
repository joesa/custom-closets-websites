/**
 * MIRROR of closet-dashboard/src/lib/ai/humanCopyVoice.ts (the canonical copy).
 *
 * The two repos cannot share a package, so the ban table is mirrored the same
 * way designFingerprint is: both repos pin a hash of the serialized table in
 * their test suites (humanCopyVoice.test.ts here, humanCopyVoice.test.ts in the
 * dashboard). If either side edits its table without editing the other, that
 * repo's pin test fails and the drift is surfaced before it ships.
 */

export type AiTellRule = {
  phrase: string
  /** Narrow trade phrases where the words describe the product, not marketing tone. */
  allowedContexts?: readonly RegExp[]
}

export const AI_TELL_RULES: readonly AiTellRule[] = [
  'elevate',
  'elevates',
  'elevating',
  'elevated',
  // "Seamless gutters" is the literal product name, including list forms like
  // "seamless aluminum, copper, and half-round gutter installation".
  { phrase: 'seamless', allowedContexts: [/\bseamless\b[^.!?]{0,60}\bgutters?\b/i] },
  'seamlessly',
  'unleash',
  'empower',
  'supercharge',
  'next-generation',
  'next-gen',
  'revolutionize',
  'unlock',
  'transform your',
  'look no further',
  "we've got you covered",
  'we have got you covered',
  'one-stop shop',
  'cutting-edge',
  'state-of-the-art',
  'world-class',
  'best-in-class',
  'tailored solutions',
  'holistic',
  'synergy',
  'leverage',
  'utilize',
  'delve',
  'embark',
  'commitment to excellence',
  'unparalleled',
  'unmatched quality',
  'experience the difference',
  'to the next level',
  "in today's fast-paced world",
  'in todays fast-paced world',
  "whether you're looking for",
  'whether you are looking for',
  'and beyond',
  'quiet luxury',
  'gallery-like restraint',
  'meticulously crafted',
  'nestled in',
  'at the heart of everything',
  'comprehensive',
  'game-changer',
  'streamline',
  'testament to',
  'we are committed to',
  'our team of experienced professionals',
  'whether you need',
].map((rule) => (typeof rule === 'string' ? { phrase: rule } : rule))

/** Phrase-only view of the rule table. */
export const AI_TELL_PHRASES: readonly string[] = AI_TELL_RULES.map((rule) => rule.phrase)

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function findAiTellPhrases(text: string, sourceText = ''): string[] {
  const hits: string[] = []
  for (const rule of AI_TELL_RULES) {
    const phraseRe = new RegExp(`\\b${escapeRe(rule.phrase)}\\b`, 'gi')
    const sourceHasPhrase = sourceText ? phraseRe.test(sourceText) : false
    phraseRe.lastIndex = 0
    if (sourceHasPhrase) continue

    for (const match of text.matchAll(phraseRe)) {
      const start = Math.max(0, (match.index ?? 0) - 40)
      const end = Math.min(text.length, (match.index ?? 0) + match[0].length + 40)
      const context = text.slice(start, end)
      if (rule.allowedContexts?.some((allowed) => allowed.test(context))) continue
      hits.push(match[0])
    }
  }
  return hits
}

// ── Placeholder tells ────────────────────────────────────────────────────────

export const PLACEHOLDER_TELL_RES: readonly RegExp[] = [
  /\bjane\s+doe\b/gi,
  /\bjohn\s+doe\b/gi,
  /\b[\w.+-]+@example\.(?:com|org|net)\b/gi,
  /\blorem\b/gi,
  /\bTODO\b/g, // case-sensitive: "to do" in prose is fine, TODO markers are not
  /\boffering\s+\d+\b/gi, // "Offering 1", "Offering 2" slot names
  /\byour\s+(?:text|copy|content|headline)\s+here\b/gi,
  /\bplaceholder\b/gi,
]

/** Unfilled-slot text (Jane Doe, lorem, TODO, "Offering 3", …). */
export function findPlaceholderTells(text: string): string[] {
  const hits: string[] = []
  for (const re of PLACEHOLDER_TELL_RES) {
    re.lastIndex = 0
    for (const match of text.matchAll(re)) hits.push(match[0])
  }
  return Array.from(new Set(hits))
}

// ── Em dash in short copy ────────────────────────────────────────────────────

export const EM_DASH_SHORT_COPY_WORD_LIMIT = 24

export function hasEmDashInShortCopy(
  text: string,
  wordLimit = EM_DASH_SHORT_COPY_WORD_LIMIT
): boolean {
  if (!text.includes('—')) return false
  return text.trim().split(/\s+/).length <= wordLimit
}

// ── Formulaic titles ─────────────────────────────────────────────────────────

export const FORMULAIC_TITLE_RE =
  /\bThe\s+[A-Z][\w’']*\s+(?:Method|Approach|Difference|Promise|Standard|System|Blueprint|Process|Experience|Touch|Way\b|Care\s+(?:Approach|Standard|Process))\b/g

export function findFormulaicTitles(text: string): string[] {
  FORMULAIC_TITLE_RE.lastIndex = 0
  return Array.from(new Set((text.match(FORMULAIC_TITLE_RE) ?? []).map((m) => m.trim())))
}
