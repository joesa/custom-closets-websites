import { describe, expect, it } from 'vitest';
import { isNonNavigationalHref } from './brandLink';

describe('isNonNavigationalHref', () => {
  it('treats empty, hash and javascript hrefs as broken', () => {
    for (const href of ['', '   ', '#', 'javascript:void(0)', 'JavaScript:alert(1)', null, undefined]) {
      expect(isNonNavigationalHref(href), String(href)).toBe(true);
    }
  });

  it('treats asset hrefs as broken — the Alvarado logo case', () => {
    for (const href of [
      '/api/a/2ZHZfz747te3HkVNFiPLAUGp38rCpwwLntEFnj7QOxvm',
      'https://vtlvqatzsolycqzeknru.supabase.co/storage/v1/object/public/site-assets/logo.png',
      '/uploads/hero-1786653007106.jpg',
      '/logo.SVG',
      'https://cdn.example.com/brand.webp?v=2',
    ]) {
      expect(isNonNavigationalHref(href), href).toBe(true);
    }
  });

  it('leaves real destinations alone', () => {
    for (const href of [
      '/',
      '/about',
      '/portfolio/gallery',
      'https://www.ditchtheform.com',
      'tel:9312782785',
      'mailto:hi@example.com',
      '#quote',
      '/services?ref=nav',
    ]) {
      expect(isNonNavigationalHref(href), href).toBe(false);
    }
  });
});
