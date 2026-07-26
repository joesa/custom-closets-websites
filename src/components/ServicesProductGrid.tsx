"use client";

import { useState } from "react";
import Image from "next/image";
import ProductDetailSheet from "@/components/ProductDetailSheet";
import type { Product, ThemeType } from "@/types/config";
import type { ThemeTokenSelection } from "@/lib/theme";
import { getGridClasses } from "@/lib/theme";

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

  return (
    <>
      <div className="w-full">
        {heading ? (
          <h2
            className={`text-2xl md:text-3xl leading-tight text-balance text-center mb-10 ${theme.headingFont}`}
          >
            {heading}
          </h2>
        ) : null}
        <div className={getGridClasses(list.length)}>
          {list.map((product, i) => (
            <button
              key={`${product.title}-${i}`}
              type="button"
              onClick={() => setSelected(product)}
              className={`border overflow-hidden transition-colors text-left min-w-0 cursor-pointer group ${theme.productCard} ${cardSurface}`}
            >
              <div className="relative aspect-[4/3] w-full">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={`object-cover ${theme.productImageHover}`}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                    <span className={`text-3xl ${theme.headingFont}`}>{product.title.slice(0, 1)}</span>
                  </div>
                )}
              </div>
              <div className="p-6 md:p-8">
                <h3 className={`text-lg md:text-xl mb-3 break-words ${theme.headingFont}`}>
                  {product.title}
                </h3>
                <p className={`text-base leading-relaxed break-words ${theme.bodyFont} ${mutedText}`}>
                  {productCardTeaser(product)}
                </p>
                <span
                  className={`mt-4 inline-block text-xs uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity ${theme.bodyFont}`}
                >
                  View details
                </span>
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
