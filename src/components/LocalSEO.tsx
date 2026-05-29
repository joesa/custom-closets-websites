import React from 'react';
import { SEOConfig } from '@/types/config';

interface LocalSEOProps {
  seo: SEOConfig;
  brandName: string;
  url: string;
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
