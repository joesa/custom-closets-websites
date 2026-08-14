import { describe, expect, it } from 'vitest';
import {
  calculateImageResize,
  parseEngineArrayMove,
  renderedImagePath,
} from './ContentEditorBridge';

describe('renderedImagePath', () => {
  it('matches Next optimized image URLs to their original content path', () => {
    const original = 'https://example.supabase.co/storage/v1/object/public/site-assets/photo.jpg';
    const optimized = `https://tenant.example.com/_next/image?url=${encodeURIComponent(original)}&w=1200&q=75`;
    expect(renderedImagePath(optimized, 'https://tenant.example.com')).toBe('/storage/v1/object/public/site-assets/photo.jpg');
    expect(renderedImagePath(original, 'https://tenant.example.com')).toBe('/storage/v1/object/public/site-assets/photo.jpg');
  });
});

describe('calculateImageResize', () => {
  it('resizes from corners into responsive width and aspect values', () => {
    expect(calculateImageResize({
      handle: 'se',
      startWidth: 400,
      startHeight: 300,
      deltaX: 100,
      deltaY: -50,
      containerWidth: 1000,
    })).toEqual({ widthPercent: 50, aspectRatio: 2 });
  });

  it('clamps hostile or accidental extreme drags', () => {
    expect(calculateImageResize({
      handle: 'nw',
      startWidth: 400,
      startHeight: 300,
      deltaX: 10000,
      deltaY: 10000,
      containerWidth: 1000,
    })).toEqual({ widthPercent: 5, aspectRatio: 1 });
  });
});

describe('parseEngineArrayMove', () => {
  it('parses content block and gallery image paths', () => {
    expect(parseEngineArrayMove('/pages_config/0/content_blocks/2/heading')).toEqual({
      arrayPath: '/pages_config/0/content_blocks',
      index: 2,
    });
    expect(parseEngineArrayMove('/pages_config/1/content_blocks/0/images/3')).toEqual({
      arrayPath: '/pages_config/1/content_blocks/0/images',
      index: 3,
    });
    expect(parseEngineArrayMove('/products_config/4/title')).toEqual({
      arrayPath: '/products_config',
      index: 4,
    });
  });

  it('returns null for non-array field paths', () => {
    expect(parseEngineArrayMove('/hero_config/headline')).toBeNull();
    expect(parseEngineArrayMove('/logo_url')).toBeNull();
  });
});
