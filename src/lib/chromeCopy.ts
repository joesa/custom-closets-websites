import { hashSeed } from '@/lib/designVariants'

/**
 * Seeded chrome copy pools.
 *
 * Every string in this file appears on rendered tenant sites as "chrome":
 * nav CTAs, widget section headings, quiz fallbacks, small labels. Before
 * these pools existed the same literal ("Get an Instant Quote", "Get Quote")
 * rendered on every site the engine produced, which is a machine-checkable
 * template fingerprint. Each helper picks deterministically from a pool via
 * the site seed, so one site always renders the same words but two sites
 * (even in the same vertical) rarely collide.
 *
 * Rules for pool entries (enforced by chromeCopy.test.ts):
 * - no em dashes
 * - no AI-tell phrases (see src/lib/humanCopyVoice.ts)
 * - no placeholder tells (lorem, Jane Doe, ...)
 * - plain, short, human wording; sentence case over Title Case where possible
 */

export type EngagementModel = 'quote' | 'order' | 'booking' | 'ticket'

export function normalizeEngagementModel(model?: string | null): EngagementModel {
  if (model === 'order' || model === 'booking' || model === 'ticket') return model
  return 'quote'
}

function pick(pool: readonly string[], seed: string, salt: string): string {
  return pool[hashSeed(`${seed}::${salt}`) % pool.length]
}

// ─── Navbar CTA ──────────────────────────────────────────────────────────────

const NAV_CTA: Record<EngagementModel, readonly string[]> = {
  quote: [
    'Get a quote',
    'Request a quote',
    'Free estimate',
    'Get an estimate',
    'Get pricing',
    'Request pricing',
    'Start a quote',
    'Price my project',
    'Request an estimate',
    'Book an estimate',
    'Get my quote',
    'Talk to us',
  ],
  order: [
    'Order now',
    'Order online',
    'Start an order',
    'See the menu',
    'Order ahead',
    'Place an order',
    'Order pickup',
    'Start your order',
    'Menu & ordering',
    'Order today',
    'Skip the line',
    'Order here',
  ],
  booking: [
    'Book now',
    'Book a time',
    'Schedule',
    'Book an appointment',
    'Reserve a time',
    'Book online',
    'Schedule a visit',
    'Book a session',
    'Find a time',
    'Reserve now',
    'Schedule online',
    'Book today',
  ],
  ticket: [
    'Get tickets',
    'Buy tickets',
    'Find tickets',
    'Reserve seats',
    'See dates',
    'Tickets & dates',
    'Reserve a spot',
    'Get seats',
    'On sale now',
    'See events',
    'Book an event',
    'Tickets here',
  ],
}

export function navCtaLabel(seed: string, model?: string | null): string {
  return pick(NAV_CTA[normalizeEngagementModel(model)], seed, 'navCta')
}

// ─── Hero primary CTA ────────────────────────────────────────────────────────

const HERO_CTA: Record<EngagementModel, readonly string[]> = {
  quote: [
    'Get Your Free Quote',
    'Request a Quote',
    'Get a Free Estimate',
    'Request a Consultation',
    'Schedule a Visit',
    'Price My Project',
    'Start With a Quote',
    'Get an Exact Price',
    'Request an Estimate',
    'Book a Site Visit',
    'See Your Price',
    'Tell Us About the Job',
  ],
  order: [
    'Order Now',
    'View Menu',
    'Start Your Order',
    'Order Online',
    'Place an Order',
    'See the Menu',
    'Order for Pickup',
    'Order Ahead',
    'Browse the Menu',
    'Order Today',
    'Start an Order',
    'Get It To Go',
  ],
  booking: [
    'Book an Appointment',
    'Schedule Now',
    'Book a Session',
    'Reserve a Time',
    'Book Service',
    'Find a Time',
    'Schedule a Visit',
    'Book Online',
    'Reserve Your Spot',
    'Pick a Time',
    'Schedule Today',
    'Book Your Visit',
  ],
  ticket: [
    'Get Tickets',
    'Buy Tickets',
    'Reserve Your Spot',
    'Find Tickets',
    'Book Event',
    'See Upcoming Dates',
    'Reserve Seats',
    'Get Your Seats',
    'Browse Events',
    'Pick a Date',
    'Tickets & Times',
    'Save Your Seat',
  ],
}

export function heroCtaLabel(seed: string, model?: string | null): string {
  return pick(HERO_CTA[normalizeEngagementModel(model)], seed, 'cta')
}

// ─── Widget (quote/order/booking/ticket) section heading + sub ───────────────

const WIDGET_HEADING: Record<EngagementModel, readonly string[]> = {
  quote: [
    'Price your project',
    'Get your number',
    'What will it cost?',
    'Start with a price',
    'See your estimate',
    'Get a real price',
    'Your project, priced',
    'Know the cost first',
    'Run the numbers',
    'Get an exact quote',
    'Price it out',
    'Start your quote',
  ],
  order: [
    'Order online',
    'Hungry? Start here',
    'Place your order',
    'The menu',
    'Order for pickup',
    'What are you having?',
    'Start an order',
    'Order ahead',
    'Skip the wait',
    'From our kitchen',
    'Your order, your way',
    'Put in an order',
  ],
  booking: [
    'Book a time',
    'Find a time',
    'Pick your slot',
    'Reserve your visit',
    'Schedule with us',
    'Book your appointment',
    'Choose a time',
    'When works for you?',
    'Get on the calendar',
    'Set up a visit',
    'Save your spot',
    'Book it now',
  ],
  ticket: [
    'Get your tickets',
    'Pick a date',
    'Reserve your seats',
    'Coming up',
    'On the calendar',
    'Save your seat',
    'Find your night',
    'Choose an event',
    'Tickets & dates',
    'What\u2019s on',
    'Grab a spot',
    'Book your event',
  ],
}

const WIDGET_SUB: Record<EngagementModel, readonly string[]> = {
  quote: [
    'Answer a few questions and see a real number, not a callback.',
    'A few details about the job gets you a clear estimate.',
    'Describe the project and see what it costs.',
    'No phone tag. Describe the work and get a price.',
    'Tell us the size and scope. The price follows.',
    'A short form now beats a site visit scheduled next week.',
    'Real pricing, based on what you actually need.',
    'Two minutes of questions. One clear price.',
    'The estimate is built from your answers, not a sales script.',
    'Start with the number. Decide from there.',
  ],
  order: [
    'Browse the menu and place your order.',
    'Pick what you want. We handle the rest.',
    'Order in a few taps. Ready when you are.',
    'Everything on the menu, ready to order.',
    'Choose your items and check out.',
    'Order ahead and skip the line.',
    'The full menu, a few taps away.',
    'Put in your order and we get started.',
  ],
  booking: [
    'Pick a service and a time that works for you.',
    'Choose what you need and grab a slot.',
    'See open times and book in a minute.',
    'Pick a time. We hold it for you.',
    'Choose a service, choose a time, done.',
    'Real-time availability. Book what fits your week.',
    'A minute to book. No calls needed.',
    'Find a slot that fits your schedule.',
  ],
  ticket: [
    'Choose a date and reserve your spot.',
    'Pick your event and lock in seats.',
    'See what\u2019s coming up and grab tickets.',
    'Dates, times, and tickets in one place.',
    'Find your date and reserve in a minute.',
    'Browse upcoming events and book yours.',
    'Pick a night. We save your seat.',
    'Reserve now, show up later.',
  ],
}

export function widgetHeading(seed: string, model?: string | null): string {
  return pick(WIDGET_HEADING[normalizeEngagementModel(model)], seed, 'widgetHeading')
}

export function widgetSubheading(seed: string, model?: string | null): string {
  return pick(WIDGET_SUB[normalizeEngagementModel(model)], seed, 'widgetSub')
}

/** Short title passed INTO the embedded widget component itself. */
const WIDGET_TITLE: Record<EngagementModel, readonly string[]> = {
  quote: ['Get an estimate', 'Price your project', 'Build your quote', 'Get your price', 'Start your estimate'],
  order: ['Place an order', 'Start your order', 'Order here', 'Your order'],
  booking: ['Book a time', 'Reserve a time', 'Pick a time', 'Book your visit'],
  ticket: ['Get tickets', 'Reserve seats', 'Pick your date', 'Book your event'],
}

export function widgetTitleLabel(seed: string, model?: string | null): string {
  return pick(WIDGET_TITLE[normalizeEngagementModel(model)], seed, 'widgetTitle')
}

// ─── Two-tier topbar fallback (when no phone number is configured) ───────────

const TOPBAR_LINE: Record<EngagementModel, readonly string[]> = {
  quote: [
    'Free estimates, no obligation',
    'Estimates are always free',
    'Fast quotes, straight answers',
    'Ask us for a free estimate',
    'Get a price before you commit',
  ],
  order: [
    'Order online for pickup',
    'Fresh orders daily',
    'Order ahead and skip the line',
    'Online ordering now open',
  ],
  booking: [
    'Online booking now open',
    'Book your visit online',
    'Same-week appointments available',
    'Reserve a time online',
  ],
  ticket: [
    'Tickets on sale now',
    'Reserve your seats online',
    'New dates added regularly',
    'Book your event online',
  ],
}

export function topbarFallbackLine(seed: string, model?: string | null): string {
  return pick(TOPBAR_LINE[normalizeEngagementModel(model)], seed, 'topbar')
}

// ─── Quiz fallbacks ───────────────────────────────────────────────────────────

const QUIZ_EYEBROW = [
  'Quick questions',
  'Before we start',
  'Point us right',
  'Three questions',
  'Help us prep',
  'A quick check',
]

const QUIZ_HEADLINE = [
  'A few details help us help you.',
  'Tell us a little about the job.',
  'Point us in the right direction.',
  'Three quick questions first.',
  'Help us understand what you need.',
  'A little context goes a long way.',
]

const QUIZ_FINISH = [
  'Thanks, that helps.',
  'Got it. Thanks.',
  'Perfect, noted.',
  'That helps a lot.',
  'Noted. One moment.',
]

export function quizEyebrowFallback(seed: string): string {
  return pick(QUIZ_EYEBROW, seed, 'quizEyebrow')
}

export function quizHeadlineFallback(seed: string): string {
  return pick(QUIZ_HEADLINE, seed, 'quizHeadline')
}

export function quizFinishLine(seed: string): string {
  return pick(QUIZ_FINISH, seed, 'quizFinish')
}

// ─── Social proof fallbacks ───────────────────────────────────────────────────

const SOCIAL_EYEBROW = [
  'Clients',
  'From customers',
  'Word of mouth',
  'After the job',
  'Feedback',
  'Recent clients',
]

const SOCIAL_HEADLINE = [
  'In their words',
  'What customers tell us',
  'Straight from clients',
  'After we finished',
  'What people say',
  'From recent jobs',
]

export function socialProofEyebrowFallback(seed: string): string {
  return pick(SOCIAL_EYEBROW, seed, 'socialEyebrow')
}

export function socialProofHeadlineFallback(seed: string): string {
  return pick(SOCIAL_HEADLINE, seed, 'socialHeadline')
}

// ─── Services page chrome ─────────────────────────────────────────────────────

const SERVICES_GRID_EYEBROW: Record<EngagementModel, readonly string[]> = {
  quote: ['Recent work', 'From the field', 'Completed jobs', 'On the job', 'Our work', 'Past projects'],
  order: ['From the kitchen', 'On the menu', 'House favorites', 'What we make', 'The lineup'],
  booking: ['What we offer', 'The services', 'On the menu', 'How we can help', 'Our services'],
  ticket: ['Coming up', 'On the calendar', 'The lineup', 'What\u2019s on', 'Upcoming'],
}

export function servicesGridEyebrow(seed: string, model?: string | null): string {
  return pick(SERVICES_GRID_EYEBROW[normalizeEngagementModel(model)], seed, 'servicesEyebrow')
}

const OFFER_HEADING = [
  'What we offer',
  'The work we do',
  'Where we can help',
  'What we take on',
  'The services',
  'How we can help',
]

export function offerHeading(seed: string): string {
  return pick(OFFER_HEADING, seed, 'offerHeading')
}

const GLANCE_LABEL = [
  'At a glance',
  'The short version',
  'Quick facts',
  'In brief',
  'The basics',
]

export function glanceLabel(seed: string): string {
  return pick(GLANCE_LABEL, seed, 'glanceLabel')
}

// ─── Portfolio section title ──────────────────────────────────────────────────

const PORTFOLIO_TITLES: Record<EngagementModel, readonly string[]> = {
  quote: [
    'Our Work',
    'Recent Projects',
    'Featured Jobs',
    'What we build',
    'Selected projects',
    'From recent jobs',
    'Work we stand behind',
    'On the books',
    'Built by us',
    'Projects in the wild',
    'Field notes',
    'Job by job',
  ],
  order: [
    'Menu',
    'What we serve',
    'From the kitchen',
    'Popular picks',
    'Order favorites',
    'House specialties',
    'The regulars order these',
    'Today\u2019s lineup',
    'Fresh off the line',
    'Crowd favorites',
    'The good stuff',
    'What\u2019s cooking',
  ],
  booking: [
    'Services',
    'What we offer',
    'Appointments',
    'Treatments',
    'Book these',
    'The service menu',
    'What clients book',
    'Most-booked services',
    'How we can help',
    'Pick your service',
    'On offer',
    'The menu',
  ],
  ticket: [
    'Events',
    'Upcoming',
    'On the calendar',
    'Experiences',
    'Get tickets for',
    'What\u2019s on',
    'This season',
    'Now booking',
    'Dates to grab',
    'The lineup',
    'Coming soon',
    'Next up',
  ],
}

export function portfolioSectionTitle(seed: string, model?: string | null): string {
  return pick(PORTFOLIO_TITLES[normalizeEngagementModel(model)], seed, 'portfolioTitle')
}

// ─── Process section eyebrow (lumina-method layout) ──────────────────────────

const PROCESS_EYEBROW = [
  'Step by step',
  'How it works',
  'The process',
  'In order',
  'Start to finish',
  'What happens when',
]

export function processEyebrow(seed: string): string {
  return pick(PROCESS_EYEBROW, seed, 'processEyebrow')
}

/** Everything above, flattened, for the CI tell-scan test. */
export const ALL_CHROME_POOL_STRINGS: readonly string[] = [
  ...Object.values(NAV_CTA).flat(),
  ...Object.values(HERO_CTA).flat(),
  ...Object.values(WIDGET_HEADING).flat(),
  ...Object.values(WIDGET_SUB).flat(),
  ...Object.values(WIDGET_TITLE).flat(),
  ...Object.values(TOPBAR_LINE).flat(),
  ...QUIZ_EYEBROW,
  ...QUIZ_HEADLINE,
  ...QUIZ_FINISH,
  ...SOCIAL_EYEBROW,
  ...SOCIAL_HEADLINE,
  ...Object.values(SERVICES_GRID_EYEBROW).flat(),
  ...OFFER_HEADING,
  ...GLANCE_LABEL,
  ...Object.values(PORTFOLIO_TITLES).flat(),
  ...PROCESS_EYEBROW,
]
