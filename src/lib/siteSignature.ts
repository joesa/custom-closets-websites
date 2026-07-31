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
  'Compassionate care',
  'Patient care',
  'In practice',
  'How we care',
  'For your family',
  'Our approach',
  'Clinical excellence',
  'Patient-first',
]

const EYEBROWS_WELLNESS = [
  'Serene care',
  'The experience',
  'In studio',
  'Holistic care',
  'Mind & Body',
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

function getEyebrowPool(brandName?: string | null, services?: string[] | null): string[] {
  const text = `${brandName || ''} ${(services || []).join(' ')}`.toLowerCase()
  if (/med|clinic|pediatr|doctor|health|urgent care|hospital|dental|dentist|physician|therapy|therapist|optom|eye care|dermatol|chiro|vet|psych|counsel|rehab/i.test(text)) {
    return EYEBROWS_MEDICAL
  }
  if (/salon|spa|barber|hair|beauty|esthetic|skincare|fitness|gym|yoga|pilates|massage|wellness/i.test(text)) {
    return EYEBROWS_WELLNESS
  }
  if (/legal|law|attorney|lawyer|account|cpa|tax|financial|real estate|insurance|consulting|architect/i.test(text)) {
    return EYEBROWS_PROFESSIONAL
  }
  return EYEBROWS_TRADE
}

function brandToken(brandName: string): string {
  const cleaned = brandName
    .replace(/\b(llc|inc|co|company|the|and|&)\b/gi, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Studio'
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
  
  const text = `${opts.brandName || ''} ${(opts.services || []).join(' ')}`.toLowerCase()
  const isMedical = /med|clinic|pediatr|doctor|health|urgent care|hospital|dental|dentist|physician|therapy|therapist|optom|eye care/i.test(text)
  const methodSuffix = isMedical ? 'Care Approach' : 'Method'
  const defaultProcess = `The ${brand} ${methodSuffix}`

  const motif =
    (opts.signature?.motif && MOTIFS.includes(opts.signature.motif)
      ? opts.signature.motif
      : MOTIFS[hashSeed(`${seed}::motif`) % MOTIFS.length]) as SignatureMotif

  const pool = getEyebrowPool(opts.brandName, opts.services)
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
