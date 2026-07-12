import { hashSeed } from '@/lib/designVariants'

export type SignatureMotif =
  | 'line'
  | 'dot'
  | 'bar'
  | 'double'
  | 'corner-brackets'
  | 'rule-stack'
  | 'seal'
  | 'ribbon'

export type SiteSignature = {
  processName: string
  motif: SignatureMotif
  eyebrow: string
}

const MOTIFS: SignatureMotif[] = [
  'line',
  'dot',
  'bar',
  'double',
  'corner-brackets',
  'rule-stack',
  'seal',
  'ribbon',
]

const EYEBROWS = [
  'How we work',
  'On every job',
  'What clients notice',
  'In practice',
  'From the shop',
  'Locally',
  'Day to day',
  'Before we start',
  'After the call',
  'Out in the field',
  'What we stand for',
  'How we show up',
  'Real talk',
  'The short version',
  'Behind the work',
  'For homeowners',
  'For businesses nearby',
  'What matters here',
  'Our habit',
  'Proven nearby',
  'Straight answers',
  'Built around you',
  'Steady hands',
  'Clear next steps',
]

const METHOD_WORDS = ['Method', 'Process', 'Standard', 'Approach', 'System', 'Craft']

function brandToken(brandName: string): string {
  const cleaned = brandName
    .replace(/\b(llc|inc|co|company|the|and|&)\b/gi, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Studio'
  // Prefer first distinctive word (often the brand name).
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
}

/**
 * Derive a stable per-site signature. Prefer explicit config.signature when
 * present (from provision); otherwise seed from brand identity.
 */
export function resolveSiteSignature(opts: {
  brandName?: string | null
  seed?: string | null
  signature?: Partial<SiteSignature> | null
  services?: string[] | null
}): SiteSignature {
  const seed = (opts.seed || opts.brandName || 'site').trim()
  const brand = brandToken(opts.brandName || 'Studio')
  const method = METHOD_WORDS[hashSeed(`${seed}::method`) % METHOD_WORDS.length]
  const defaultProcess = `The ${brand} ${method}`

  const motif =
    (opts.signature?.motif && MOTIFS.includes(opts.signature.motif)
      ? opts.signature.motif
      : MOTIFS[hashSeed(`${seed}::motif`) % MOTIFS.length]) as SignatureMotif

  const eyebrow =
    opts.signature?.eyebrow?.trim() ||
    EYEBROWS[hashSeed(`${seed}::eyebrow`) % EYEBROWS.length]

  return {
    processName: opts.signature?.processName?.trim() || defaultProcess,
    motif,
    eyebrow,
  }
}

export function widgetRadiusFromSeed(seed?: string | null): 'sharp' | 'soft' | 'pill' {
  const key = (seed || 'site').trim()
  const pool = ['sharp', 'soft', 'pill'] as const
  return pool[hashSeed(`${key}::radius`) % pool.length]
}
