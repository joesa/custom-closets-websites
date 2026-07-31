"use client";

import { useState } from "react";
import Image from "next/image";
import ProductDetailSheet from "@/components/ProductDetailSheet";
import type { Product, ThemeType } from "@/types/config";
import type { ThemeTokenSelection } from "@/lib/theme";
import { getGridClasses } from "@/lib/theme";

import { hashSeed } from "@/lib/designVariants";

type ThemeLike = {
  headingFont: string;
  bodyFont: string;
  textSecondary: string;
  productCard: string;
  productImageHover: string;
};

/** Short teaser for the card face — full copy lives in the detail drawer. */
export function productCardTeaser(product: Product, maxChars = 140): string {
  const raw = (product.description || "").trim();
  if (!raw) return "Tap for details.";
  if (raw.length <= maxChars) return raw;
  const cut = raw.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export default function ServicesProductGrid({
  products,
  theme,
  themeType,
  themeTokens,
  fontSeed,
  heading,
  mutedText,
  cardSurface,
}: {
  products: Product[];
  theme: ThemeLike;
  themeType: ThemeType;
  themeTokens?: ThemeTokenSelection | null;
  fontSeed?: string;
  heading?: string;
  mutedText: string;
  cardSurface: string;
}) {
  const [selected, setSelected] = useState<Product | null>(null);
  const list = products.filter((p) => p?.title);

  if (list.length === 0) return null;

  const isStaggered = fontSeed && list.length >= 3 && hashSeed(`${fontSeed}::staggered-grid`) % 2 === 0;

  const getStaggerClasses = (index: number) => {
    if (!isStaggered) return "";
    switch (index % 4) {
      case 0:
        return "md:col-span-7";
      case 1:
        return "md:col-span-5 md:mt-20";
      case 2:
        return "md:col-start-2 md:col-span-5 md:mt-12";
      case 3:
        return "md:col-span-6 md:mt-28";
      default:
        return "md:col-span-6";
    }
  };

  return (
    <>
      <div className="w-full">
        {heading ? (
          <div className="mb-12">
            <p className="ds-eyebrow mb-3">Recent jobs</p>
            <h2
              className={`text-2xl md:text-4xl leading-tight text-balance ${theme.headingFont}`}
            >
              {heading}
            </h2>
          </div>
        ) : null}

        <div className={isStaggered ? "grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-start" : getGridClasses(list.length)}>
          {list.map((product, i) => (
            <button
              key={`${product.title}-${i}`}
              type="button"
              onClick={() => setSelected(product)}
              className={`border overflow-hidden transition-colors text-left min-w-0 cursor-pointer group ds-framed-img ${theme.productCard} ${cardSurface} ${getStaggerClasses(i)}`}
            >
              <div className="relative aspect-[4/3] w-full">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={`object-cover ${theme.productImageHover}`}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                    <span className={`text-3xl ${theme.headingFont}`}>{product.title.slice(0, 1)}</span>
                  </div>
                )}
              </div>
              <div className="p-6 md:p-8">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className={`text-lg md:text-xl break-words ${theme.headingFont}`}>
                    {product.title}
                  </h3>
                  <span className="text-[11px] tracking-[0.18em] uppercase ds-mute shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <p className={`mt-3 text-sm leading-relaxed break-words ${theme.bodyFont} ${mutedText}`}>
                  {productCardTeaser(product)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <ProductDetailSheet
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        product={selected}
        theme={themeType}
        themeTokens={themeTokens}
        fontSeed={fontSeed}
      />
    </>
  );
}
