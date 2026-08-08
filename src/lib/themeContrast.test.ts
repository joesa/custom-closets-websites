import { describe, expect, it } from 'vitest';
import { ACCENT_SWATCHES, THEME_IDS, getThemeStyles, twBgToHex, twTextToColor } from './theme';

function rgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  if (!/^[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(value)) throw new Error(`Unsupported color: ${hex}`);
  const channels = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
  if (value.length === 8) {
    const alpha = Number.parseInt(value.slice(6, 8), 16) / 255;
    return channels.map((channel) => Math.round(channel * alpha + 255 * (1 - alpha))) as [number, number, number];
  }
  return channels as [number, number, number];
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

describe('complete template theme matrix', () => {
  it('keeps primary and secondary body text at WCAG AA on every theme surface', () => {
    const failures = THEME_IDS.flatMap((theme) => {
      const styles = getThemeStyles(theme);
      const background = twBgToHex(styles.pageBackground);
      const primary = contrast(twTextToColor(styles.textPrimary), background);
      const secondary = contrast(twTextToColor(styles.textSecondary), background);
      const accent = contrast(twTextToColor(styles.accentColor), background);
      const cardBackground = /bg-(?:white|black)\/(?:\[)?\d/.test(styles.productCard)
        ? background
        : twBgToHex(styles.productCard);
      const cardPrimary = contrast(twTextToColor(styles.textPrimary), cardBackground);
      const cardSecondary = contrast(twTextToColor(styles.textSecondary), cardBackground);
      return [
        ...(primary >= 4.5 ? [] : [`${theme}/primary: ${primary.toFixed(2)}:1`]),
        ...(secondary >= 4.5 ? [] : [`${theme}/secondary: ${secondary.toFixed(2)}:1`]),
        ...(accent >= 4.5 ? [] : [`${theme}/accent: ${accent.toFixed(2)}:1`]),
        ...(cardPrimary >= 4.5 ? [] : [`${theme}/card-primary: ${cardPrimary.toFixed(2)}:1`]),
        ...(cardSecondary >= 4.5 ? [] : [`${theme}/card-secondary: ${cardSecondary.toFixed(2)}:1`]),
      ];
    });

    expect(failures).toEqual([]);
  });

  it('keeps every theme button label at WCAG AA on its fill', () => {
    const failures = THEME_IDS.flatMap((theme) => {
      const styles = getThemeStyles(theme);
      const isTransparent = styles.button.split(/\s+/).includes('bg-transparent');
      const background = isTransparent ? twBgToHex(styles.pageBackground) : twBgToHex(styles.button);
      const labelClass = styles.button.split(/\s+/).find((className) => className.startsWith('text-')) || styles.textPrimary;
      const ratio = contrast(twTextToColor(labelClass), background);
      return ratio >= 4.5 ? [] : [`${theme}/button: ${ratio.toFixed(2)}:1`];
    });

    expect(failures).toEqual([]);
  });
});
