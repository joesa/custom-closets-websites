import React from 'react';
import { SEOConfig } from '@/types/config';

interface LocalSEOProps {
  seo: SEOConfig;
  brandName: string;
  url: string;
}

/** Prevent user-controlled SEO strings from terminating the JSON-LD script. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export default function LocalSEO({ seo, brandName, url }: LocalSEOProps) {
  if (!seo || Object.keys(seo).length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "name": brandName,
    "telephone": seo.phone,
    "url": url,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": seo.streetAddress,
      "addressLocality": seo.addressLocality,
      "addressRegion": seo.addressRegion,
      "postalCode": seo.postalCode,
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": seo.geo?.latitude,
      "longitude": seo.geo?.longitude
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}
