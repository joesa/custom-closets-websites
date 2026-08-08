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

const EYEBROWS_MEDICAL = [
  'Patient care',
  'In practice',
  'How we care',
  'For your family',
  'Our approach',
  'Clinical care',
  'Patient-first',
  'At the clinic',
]

const EYEBROWS_WELLNESS = [
  'Serene care',
  'The experience',
  'In studio',
  'Mind & Body',
  'Your wellbeing',
]

const EYEBROWS_PROFESSIONAL = [
  'Our practice',
  'Client commitment',
  'In practice',
  'Strategic guidance',
]

const EYEBROWS_TRADE = [
  'How we work',
  'On every job',
  'What clients notice',
  'Day to day',
  'What we stand for',
  'How we show up',
  'Clear next steps',
  'Built around you',
  'Master craftsmanship',
]

// Process-section titles for legacy rows without a provisioned signature.
// Deliberately NOT the "The {Brand} Method" formula — that fill-in-the-blank
// title is a recognisable generator signature. Mirrors the pools in
// closet-dashboard/src/lib/provision/siteSignature.ts.
const PROCESS_TITLES_TRADE = [
  'How we run a job',
  'From first call to final walkthrough',
  'What happens after you book',
  'How the work gets done',
  'Start to finish',
  'How a project moves',
  'The order we work in',
  'What to expect on site',
]
const PROCESS_TITLES_MEDICAL = [
  'What a visit looks like',
  'From booking to follow-up',
  'How appointments work',
  'Your first visit, step by step',
  'What to expect at your visit',
  'How care moves forward',
]
const PROCESS_TITLES_PROFESSIONAL = [
  'How an engagement works',
  'From consultation to resolution',
  'What working together looks like',
  'How we take on new work',
  'From first meeting to final filing',
  'What happens after you reach out',
]
const PROCESS_TITLES_WELLNESS = [
  'What to expect',
  'From booking to your first session',
  'How sessions work',
  'Your first visit, start to finish',
  'How we set up your routine',
  'What a session looks like',
]

type VerticalHint = 'medical' | 'wellness' | 'professional' | 'trade'

function detectVerticalHint(brandName?: string | null, services?: string[] | null): VerticalHint {
  const text = `${brandName || ''} ${(services || []).join(' ')}`.toLowerCase()
  if (/med|clinic|pediatr|doctor|health|urgent care|hospital|dental|dentist|physician|therapy|therapist|optom|eye care|dermatol|chiro|vet|psych|counsel|rehab/i.test(text)) {
    return 'medical'
  }
  if (/salon|spa|barber|hair|beauty|esthetic|skincare|fitness|gym|yoga|pilates|massage|wellness/i.test(text)) {
    return 'wellness'
  }
  if (/legal|law|attorney|lawyer|account|cpa|tax|financial|real estate|insurance|consulting|architect/i.test(text)) {
    return 'professional'
  }
  return 'trade'
}

function getEyebrowPool(hint: VerticalHint): string[] {
  switch (hint) {
    case 'medical': return EYEBROWS_MEDICAL
    case 'wellness': return EYEBROWS_WELLNESS
    case 'professional': return EYEBROWS_PROFESSIONAL
    default: return EYEBROWS_TRADE
  }
}

function getProcessTitlePool(hint: VerticalHint): string[] {
  switch (hint) {
    case 'medical': return PROCESS_TITLES_MEDICAL
    case 'wellness': return PROCESS_TITLES_WELLNESS
    case 'professional': return PROCESS_TITLES_PROFESSIONAL
    default: return PROCESS_TITLES_TRADE
  }
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
  const hint = detectVerticalHint(opts.brandName, opts.services)
  const titlePool = getProcessTitlePool(hint)
  const defaultProcess = titlePool[hashSeed(`${seed}::method`) % titlePool.length]

  const motif =
    (opts.signature?.motif && MOTIFS.includes(opts.signature.motif)
      ? opts.signature.motif
      : MOTIFS[hashSeed(`${seed}::motif`) % MOTIFS.length]) as SignatureMotif

  const pool = getEyebrowPool(hint)
  const eyebrow =
    opts.signature?.eyebrow?.trim() ||
    pool[hashSeed(`${seed}::eyebrow`) % pool.length]

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
