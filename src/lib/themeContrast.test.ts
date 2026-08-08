import { describe, expect, it } from 'vitest';
import { ACCENT_SWATCHES, twBgToHex, twTextToColor } from './theme';

function rgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) throw new Error(`Unsupported color: ${hex}`);
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16)) as [number, number, number];
}

function luminance(hex: string): number {
  const channels = rgb(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe('curated accent swatches', () => {
  it('keeps button text at WCAG AA contrast on every accent fill', () => {
    const failures = Object.entries(ACCENT_SWATCHES).flatMap(([name, swatch]) => {
      const ratio = contrast(twTextToColor(swatch.on), twBgToHex(swatch.bg));
      return ratio >= 4.5 ? [] : [`${name}: ${ratio.toFixed(2)}:1`];
    });

    expect(failures).toEqual([]);
  });

  it('keeps accent text readable on representative light and dark surfaces', () => {
    const failures = Object.entries(ACCENT_SWATCHES).flatMap(([name, swatch]) => {
      const lightRatio = contrast(twTextToColor(swatch.textLight), '#ffffff');
      const darkRatio = contrast(twTextToColor(swatch.textDark), '#18181b');
      return [
        ...(lightRatio >= 4.5 ? [] : [`${name}/light: ${lightRatio.toFixed(2)}:1`]),
        ...(darkRatio >= 4.5 ? [] : [`${name}/dark: ${darkRatio.toFixed(2)}:1`]),
      ];
    });

    expect(failures).toEqual([]);
  });
});
