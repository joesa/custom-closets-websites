"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface GalleryLightboxProps {
  images: string[];
  /** Page/section heading used when a per-image caption is absent. */
  altPrefix: string;
  /** Optional per-image captions/alts from page copy (preferred over formulaic numbering). */
  imageAlts?: Array<string | undefined | null>;
  imageSize?: 'small' | 'medium' | 'large' | 'full';
  imageAspect?: 'square' | 'landscape' | 'wide' | 'portrait';
  imageFit?: 'cover' | 'contain';
}

const sizeClasses = { small: 'max-w-3xl mx-auto', medium: 'max-w-5xl mx-auto', large: 'max-w-7xl mx-auto', full: 'max-w-none' };
const aspectClasses = { square: 'aspect-square', landscape: 'aspect-[4/3]', wide: 'aspect-video', portrait: 'aspect-[3/4]' };

function galleryAlt(
  altPrefix: string,
  index: number,
  imageAlts?: Array<string | undefined | null>
): string {
  const caption = imageAlts?.[index]?.trim();
  if (caption) return caption;
  const base = altPrefix.trim() || 'Gallery';
  // Prefer page copy over formulaic "project N" numbering.
  return base;
}

export default function GalleryLightbox({
  images,
  altPrefix,
  imageAlts,
  imageSize = 'full',
  imageAspect = 'landscape',
  imageFit = 'cover',
}: GalleryLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveIndex(null);
      if (e.key === "ArrowRight") setActiveIndex((i) => (i === null ? null : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setActiveIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, images.length]);

  return (
    <>
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${sizeClasses[imageSize]}`}>
        {images.map((src, i) => {
          const alt = galleryAlt(altPrefix, i, imageAlts);
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Enlarge ${alt}`}
              className={`ds-image-frame relative overflow-hidden rounded-xl border border-white/10 cursor-zoom-in group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${aspectClasses[imageAspect]}`}
            >
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className={`ds-art-image ${imageFit === 'contain' ? 'object-contain' : 'object-cover'} transition-transform duration-300 group-hover:scale-105`}
              />
            </button>
          );
        })}
      </div>

      {activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveIndex(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-10"
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            aria-label="Close"
            className="absolute top-4 right-4 md:top-6 md:right-6 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
                }}
                aria-label="Previous image"
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i === null ? null : (i + 1) % images.length));
                }}
                aria-label="Next image"
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="ds-image-frame relative w-full h-full max-w-5xl max-h-[85vh]"
          >
            <Image
              src={images[activeIndex]}
              alt={galleryAlt(altPrefix, activeIndex, imageAlts)}
              fill
              sizes="100vw"
              className="ds-art-image object-contain"
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}
