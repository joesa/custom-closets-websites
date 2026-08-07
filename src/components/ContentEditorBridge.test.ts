import { describe, expect, it } from 'vitest';
import { renderedImagePath } from './ContentEditorBridge';

describe('renderedImagePath', () => {
  it('matches Next optimized image URLs to their original content path', () => {
    const original = 'https://example.supabase.co/storage/v1/object/public/site-assets/photo.jpg';
    const optimized = `https://tenant.example.com/_next/image?url=${encodeURIComponent(original)}&w=1200&q=75`;
    expect(renderedImagePath(optimized, 'https://tenant.example.com')).toBe('/storage/v1/object/public/site-assets/photo.jpg');
    expect(renderedImagePath(original, 'https://tenant.example.com')).toBe('/storage/v1/object/public/site-assets/photo.jpg');
  });
});
