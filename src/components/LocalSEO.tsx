import React from 'react';
import { SEOConfig } from '@/types/config';

interface LocalSEOProps {
  seo: SEOConfig;
  brandName: string;
  url: string;
  /** Industry / trade label from site config; picks the schema.org @type. */
  industry?: string | null;
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

/**
 * Map an industry label to the most specific schema.org LocalBusiness subtype.
 * Every tenant used to emit "HomeAndConstructionBusiness" regardless of trade,
 * which is both a schema error (restaurants are not construction businesses)
 * and a machine-checkable fingerprint of the generator.
 */
export function schemaTypeForIndustry(industry?: string | null): string {
  const text = (industry || '').toLowerCase();
  if (!text) return 'LocalBusiness';

  const rules: Array<[RegExp, string]> = [
    [/restaurant|bar\b|cafe|coffee|bakery|pizzeria|catering|food truck|deli|bistro|grill/, 'Restaurant'],
    [/law|legal|attorney|lawyer/, 'LegalService'],
    [/account|cpa|tax|bookkeep/, 'AccountingService'],
    [/financ|invest|wealth/, 'FinancialService'],
    [/insurance/, 'InsuranceAgency'],
    [/real estate|realtor|property management/, 'RealEstateAgent'],
    [/dentist|dental/, 'Dentist'],
    [/pediatric|clinic|medical|physician|doctor|urgent care|health/, 'MedicalClinic'],
    [/chiroprac|physical therapy|physio|rehab/, 'MedicalClinic'],
    [/veterinar|vet clinic|animal hospital/, 'VeterinaryCare'],
    [/salon|hair|barber/, 'HairSalon'],
    [/spa\b|esthetic|skincare|facial|massage|wellness/, 'DaySpa'],
    [/nail/, 'NailSalon'],
    [/gym|fitness|crossfit|pilates|yoga/, 'ExerciseGym'],
    [/photograph|videograph/, 'ProfessionalService'],
    [/auto|mechanic|car repair|detailing|tire|body shop/, 'AutoRepair'],
    [/car wash/, 'AutoWash'],
    [/clean|maid|janitorial/, 'CleaningService'],
    [/mover|moving/, 'MovingCompany'],
    [/plumb/, 'Plumber'],
    [/electric/, 'Electrician'],
    [/roof/, 'RoofingContractor'],
    [/hvac|heating|cooling|air conditioning/, 'HVACBusiness'],
    [/pest/, 'PestControl'],
    [/landscap|lawn|tree service|irrigation|hardscap/, 'LandscapingBusiness'],
    [/lock/, 'Locksmith'],
    [/daycare|childcare|preschool|montessori/, 'ChildCare'],
    [/school|tutor|lessons|academy|instruction|training/, 'EducationalOrganization'],
    [/travel/, 'TravelAgency'],
    [/event|wedding plann|venue/, 'EventVenue'],
    [/storage|organiz|closet|garage|cabinet|remodel|construction|contractor|builder|handyman|paint|floor|window|door|deck|fence|gutter|siding|mason|concrete|insulation|drywall|tile|counter/, 'HomeAndConstructionBusiness'],
  ];

  for (const [re, type] of rules) {
    if (re.test(text)) return type;
  }
  return 'LocalBusiness';
}

export default function LocalSEO({ seo, brandName, url, industry }: LocalSEOProps) {
  if (!seo || Object.keys(seo).length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": schemaTypeForIndustry(industry),
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
