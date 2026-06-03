"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getSectionTokens, getThemeStyles } from '@/lib/theme';
import { NavLink, ThemeType } from '@/types/config';

interface NavbarProps {
  brandName: string;
  links: NavLink[];
  themeName: ThemeType;
  logoUrl?: string;
}

/** Bar + link colors that stay readable over photo heroes and solid page backgrounds. */
function navChrome(themeName: ThemeType, scrolled: boolean) {
  const { isDark } = getSectionTokens(themeName);
  if (isDark) {
    return {
      bar: scrolled
        ? 'bg-neutral-950/95 backdrop-blur-md border-b border-white/15 py-4 shadow-lg'
        : 'bg-neutral-950/80 backdrop-blur-md border-b border-white/10 py-5 shadow-md',
      brand: 'text-white',
      link: 'text-white/90 hover:text-white',
      linkShadow: 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]',
      cta: 'border-white/40 text-white hover:bg-white hover:text-neutral-950',
    };
  }
  return {
    bar: scrolled
      ? 'bg-white/98 backdrop-blur-md border-b border-neutral-200 py-4 shadow-md'
      : 'bg-white/92 backdrop-blur-md border-b border-neutral-200/90 py-5 shadow-sm',
    brand: 'text-neutral-900',
    link: 'text-neutral-800 hover:text-neutral-950',
    linkShadow: 'drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]',
    cta: 'border-neutral-900/25 text-neutral-900 hover:bg-neutral-900 hover:text-white',
  };
}

export default function Navbar({ brandName, links, themeName, logoUrl }: NavbarProps) {
  const theme = getThemeStyles(themeName);
  const [scrolled, setScrolled] = useState(false);
  const chrome = navChrome(themeName, scrolled);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const rounded = theme.button.includes('rounded-none') ? 'rounded-none' : 'rounded-full';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${chrome.bar}`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link
          href="/"
          className={`text-xl font-bold tracking-wider ${chrome.brand} ${chrome.linkShadow} ${theme.headingFont}`}
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={brandName}
              width={180}
              height={48}
              className="h-9 w-auto object-contain"
              priority
            />
          ) : (
            brandName
          )}
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {links
            .filter((link) => typeof link?.slug === 'string' && link.slug.length > 0)
            .map((link, i) => (
              <Link
                key={i}
                href={link.slug}
                className={`text-sm tracking-widest transition-colors font-medium ${chrome.link} ${chrome.linkShadow}`}
              >
                {link.label}
              </Link>
            ))}
          <Link
            href="/#quote"
            className={`ml-4 px-6 py-2 text-xs uppercase tracking-widest font-bold border transition-all ${rounded} ${chrome.cta}`}
          >
            Get Quote
          </Link>
        </div>
      </div>
    </nav>
  );
}
