// Per-theme hero fallback images. Mirrors THEME_HERO in
// closet-dashboard/src/lib/provision/buildTemplateSiteConfig.ts.
//
// Before this map existed, every heroless site rendered the same single
// Unsplash closet photo (photo-1600585154340) regardless of theme or trade —
// a one-request fleet fingerprint. Drift with the dashboard map is cosmetic
// (both sides fall back to a real photo), so no pin test is needed.

const THEME_HERO_FALLBACK: Record<string, string> = {
  'luxury-minimal': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
  brutalist: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81',
  'classic-warm': 'https://images.unsplash.com/photo-1556910103-1c02745a872f',
  'modern-office': 'https://images.unsplash.com/photo-1524758631624-e2822e304c36',
  'playful-kids': 'https://images.unsplash.com/photo-1505693314120-0d443867891c',
  'rustic-pantry': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a',
  'sleek-entertainment': 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5',
  'elegant-dressing': 'https://images.unsplash.com/photo-1595428774223-ef52624120d2',
  'functional-utility': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e',
  'creative-craft': 'https://images.unsplash.com/photo-1452860607046-6d350d744276',
  'sophisticated-wine': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3',
  'cozy-library': 'https://images.unsplash.com/photo-1507842217343-583bb7270b66',
  'minimalist-zen': 'https://images.unsplash.com/photo-1545389336-cf090694435e',
  'garage-industrial': 'https://images.unsplash.com/photo-1486262715619-67b93e8d82c5',
  'pantry-fresh': 'https://images.unsplash.com/photo-1490818387583-1baba5e638af',
  'laundry-clean': 'https://images.unsplash.com/photo-1585429371326-7f264a7de3d0',
  'mudroom-family': 'https://images.unsplash.com/photo-1600585154526-990dced4db0d',
  'commercial-pro': 'https://images.unsplash.com/photo-1497366216548-37526070297c',
  'coastal-climate': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
  'historic-classic': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
  'luxury-gallery': 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec',
  'kids-playful': 'https://images.unsplash.com/photo-1505693314120-0d443867891c',
  'media-theater': 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5',
  'office-executive': 'https://images.unsplash.com/photo-1524758631624-e2822e304c36',
  'wine-cellar': 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb',
  'fresh-clean': 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac',
  'warm-handyman': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd',
  'rich-flooring': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
  'artisan-wood': 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261',
  'swift-mobile': 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f',
  'clean-move': 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b',
  'urban-reclaim': 'https://images.unsplash.com/photo-1558618047-f4cf4f1d82af',
  'stone-masonry': 'https://images.unsplash.com/photo-1558981852-426c349dafd0',
  'appliance-pro': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1',
  'care-comfort': 'https://images.unsplash.com/photo-1507842217343-583bb7270b66',
  'pool-resort': 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7',
  'home-guardian': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa',
  'eco-solar': 'https://images.unsplash.com/photo-1509391366360-2e959784a276',
  'pastoral-pet': 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7',
  'hearth-warm': 'https://images.unsplash.com/photo-1513694203232-719a280e022f',
  'seasonal-outdoor': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b',
  'garage-smart': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e',
  'window-light': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952',
  'bold-remodel': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136',
  'winter-ready': 'https://images.unsplash.com/photo-1551529834-525807d6b4f3',
  'event-festive': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
  'wellness-calm': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef',
  'fleet-logistics': 'https://images.unsplash.com/photo-1545558014-8692077e9b5c',
  'media-creative': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
  'gourmet-warm': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a',
}

/** Neutral non-closet interior; used only when the theme has no mapping. */
const GENERIC_HERO_FALLBACK = 'https://images.unsplash.com/photo-1558211583-d26f610c1eb1'

export function heroFallbackForTheme(theme?: string | null): string {
  return THEME_HERO_FALLBACK[theme || ''] || GENERIC_HERO_FALLBACK
}
