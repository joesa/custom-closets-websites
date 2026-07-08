"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getSectionTokens, getThemeStyles, applyVoice, ThemeTokenSelection } from '@/lib/theme';
import { NavLink, ThemeType } from '@/types/config';
import type { NavComposition } from '@/lib/designVariants';

interface NavbarProps {
  brandName: string;
  links: NavLink[];
  themeName: ThemeType;
  themeTokens?: ThemeTokenSelection | null;
  logoUrl?: string;
  fontSeed?: string;
  /** Structural nav layout — defaults to the classic single-row bar. */
  navStyle?: NavComposition;
  /** Shown in the 'two-tier-topbar' composition's utility bar, when present. */
  phone?: string;
  /** 'order' businesses (e.g. restaurants-bars) get an "Order" CTA instead
   *  of "Get Quote" — see EngagementModel in closet-dashboard's catalog. */
  engagementModel?: string;
}

/** Bar + link colors that stay readable over photo heroes and solid page backgrounds. */
function navChrome(themeName: ThemeType, scrolled: boolean, themeTokens?: ThemeTokenSelection | null, bgStyle: string = 'glass') {
  const { isDark, accent, accentBg, accentText } = getSectionTokens(themeName, '', themeTokens);
  
  let barClass = '';
  if (isDark) {
    if (bgStyle === 'solid') {
      barClass = 'bg-neutral-950 border-b border-white/10 py-4 shadow-lg';
    } else if (bgStyle === 'transparent') {
      barClass = scrolled ? 'bg-neutral-950/95 backdrop-blur-md border-b border-white/15 py-4 shadow-lg' : 'bg-transparent py-6';
    } else if (bgStyle === 'frosted-heavy') {
      barClass = scrolled ? 'bg-neutral-950/95 backdrop-blur-xl border-b border-white/20 py-4 shadow-lg' : 'bg-neutral-950/85 backdrop-blur-xl border-b border-white/15 py-5 shadow-md';
    } else {
      // glass
      barClass = scrolled ? 'bg-neutral-950/95 backdrop-blur-md border-b border-white/15 py-4 shadow-lg' : 'bg-neutral-950/80 backdrop-blur-md border-b border-white/10 py-5 shadow-md';
    }

    return {
      bar: barClass,
      brand: 'text-white',
      link: 'text-white/90 hover:text-white',
      linkShadow: bgStyle === 'transparent' && !scrolled ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]' : 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]',
      cta: `border-current ${accent} hover:opacity-75`,
      ctaFilled: `${accentBg} ${accentText} hover:opacity-90`,
      topbar: 'bg-neutral-950 text-white/70 border-b border-white/10',
    };
  }

  if (bgStyle === 'solid') {
    barClass = 'bg-white border-b border-neutral-200 py-4 shadow-md';
  } else if (bgStyle === 'transparent') {
    barClass = scrolled ? 'bg-white/98 backdrop-blur-md border-b border-neutral-200 py-4 shadow-md' : 'bg-transparent py-6';
  } else if (bgStyle === 'frosted-heavy') {
    barClass = scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-neutral-200 py-4 shadow-lg' : 'bg-white/85 backdrop-blur-xl border-b border-neutral-200/90 py-5 shadow-md';
  } else {
    // glass
    barClass = scrolled ? 'bg-white/98 backdrop-blur-md border-b border-neutral-200 py-4 shadow-md' : 'bg-white/92 backdrop-blur-md border-b border-neutral-200/90 py-5 shadow-sm';
  }

  return {
    bar: barClass,
    brand: 'text-neutral-900',
    link: 'text-neutral-800 hover:text-neutral-950',
    linkShadow: bgStyle === 'transparent' && !scrolled ? 'drop-shadow-[0_1px_1px_rgba(255,255,255,1)]' : 'drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]',
    cta: `border-current ${accent} hover:opacity-75`,
    ctaFilled: `${accentBg} ${accentText} hover:opacity-90`,
    topbar: 'bg-neutral-900 text-white/80',
  };
}

export default function Navbar({
  brandName,
  links,
  themeName,
  themeTokens,
  logoUrl,
  fontSeed,
  navStyle = 'classic::glass::fade',
  phone,
  engagementModel,
}: NavbarProps) {
  const [layout = 'classic', bg = 'glass', hover = 'fade'] = (navStyle as string).split('::');

  const theme = applyVoice(getThemeStyles(themeName, themeTokens), themeName, fontSeed ?? '', themeTokens);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const chrome = navChrome(themeName, scrolled, themeTokens, bg);
  const ctaLabel = engagementModel === 'order' ? 'Order Now' 
                 : engagementModel === 'booking' ? 'Book Now' 
                 : engagementModel === 'ticket' ? 'Get Tickets' 
                 : 'Get Quote';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const rounded = theme.button.includes('rounded-none') ? 'rounded-none' : 'rounded-full';
  const visibleLinks = links.filter(
    (link) => typeof link?.slug === 'string' && link.slug.length > 0 && !link.slug.includes('#quote') && link.slug !== '/quote'
  );

  const Brand = () => (
    <Link
      href="/"
      className={`text-xl font-bold tracking-wider ${chrome.brand} ${chrome.linkShadow} ${theme.headingFont}`}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={brandName}
          width={280}
          height={90}
          className="h-16 w-auto object-contain sm:h-20"
          priority
        />
      ) : (
        brandName
      )}
    </Link>
  );

  const NavItems = () => (
    <>
      {visibleLinks.map((link, i) => {
        let hoverClasses = 'hover:opacity-75'; // default fade
        let innerExtra = null;

        if (hover === 'underline') {
          hoverClasses = '';
          innerExtra = <span className="absolute left-0 -bottom-1 h-px w-0 bg-current transition-all duration-300 group-hover:w-full" />;
        } else if (hover === 'overline') {
          hoverClasses = '';
          innerExtra = <span className="absolute left-0 -top-1 h-px w-0 bg-current transition-all duration-300 group-hover:w-full" />;
        } else if (hover === 'bracket') {
          hoverClasses = 'before:content-["["] after:content-["]"] before:opacity-0 after:opacity-0 before:-translate-x-2 after:translate-x-2 group-hover:before:opacity-100 group-hover:after:opacity-100 group-hover:before:translate-x-0 group-hover:after:translate-x-0 before:transition-all after:transition-all before:mr-1 after:ml-1';
        } else if (hover === 'pill') {
          hoverClasses = 'hover:bg-white/10 px-3 py-1 rounded-full -mx-3 -my-1';
        }

        return (
          <Link
            key={i}
            href={link.slug}
            className={`group relative text-sm tracking-widest transition-colors font-medium ${chrome.link} ${chrome.linkShadow} ${hoverClasses}`}
          >
            {link.label}
            {innerExtra}
          </Link>
        );
      })}
    </>
  );

  const CtaButton = ({ filled = false }: { filled?: boolean }) => (
    <Link
      href="/#quote"
      className={`px-6 py-2 text-xs uppercase tracking-widest font-bold border transition-all ${rounded} ${
        filled ? chrome.ctaFilled + ' border-transparent' : chrome.cta
      }`}
    >
      {ctaLabel}
    </Link>
  );

  // ─── mobile: hamburger toggle + dropdown panel, shared across every composition ───
  const MobileToggle = () => (
    <button
      type="button"
      aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={mobileOpen}
      onClick={() => setMobileOpen((v) => !v)}
      className={`md:hidden inline-flex items-center justify-center w-9 h-9 ${chrome.brand} ${chrome.linkShadow}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        {mobileOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
      </svg>
    </button>
  );

  const MobileMenu = () => {
    if (!mobileOpen) return null;
    return (
      <div
        className={`md:hidden absolute top-full left-0 right-0 mt-3 rounded-2xl p-6 flex flex-col items-start gap-4 shadow-xl ${chrome.bar}`}
      >
        {visibleLinks.map((link, i) => (
          <Link
            key={i}
            href={link.slug}
            onClick={() => setMobileOpen(false)}
            className={`text-base tracking-widest font-medium ${chrome.link}`}
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/#quote"
          onClick={() => setMobileOpen(false)}
          className={`mt-1 px-6 py-2 text-xs uppercase tracking-widest font-bold rounded-full border border-transparent ${chrome.ctaFilled}`}
        >
          {ctaLabel}
        </Link>
      </div>
    );
  };

  // ─── centered-stack: logo on its own row, links + CTA centered below ───
  if (layout === 'centered-stack') {
    return (
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${chrome.bar}`}>
        <div className="relative max-w-7xl mx-auto px-6 flex flex-col items-center gap-3">
          <div className="w-full flex items-center justify-center relative">
            <Brand />
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <MobileToggle />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <NavItems />
            <CtaButton />
          </div>
          <MobileMenu />
        </div>
      </nav>
    );
  }

  // ─── split-cta: logo left, links centered in the middle, CTA filled far right ───
  if (layout === 'split-cta') {
    return (
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${chrome.bar}`}>
        <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-[auto_1fr_auto] items-center gap-6">
          <Brand />
          <div className="hidden md:flex items-center justify-center gap-8">
            <NavItems />
          </div>
          <div className="justify-self-end flex items-center gap-3">
            <div className="hidden md:block">
              <CtaButton filled />
            </div>
            <MobileToggle />
          </div>
          <MobileMenu />
        </div>
      </nav>
    );
  }

  // ─── boxed-floating: inset rounded pill bar, not full-bleed ───
  if (layout === 'boxed-floating') {
    return (
      <nav className="fixed top-4 left-4 right-4 z-50">
        <div
          className={`relative max-w-7xl mx-auto px-6 py-4 flex items-center justify-between rounded-2xl transition-all duration-300 ${chrome.bar} rounded-2xl`}
        >
          <Brand />
          <div className="hidden md:flex items-center gap-8">
            <NavItems />
            <CtaButton />
          </div>
          <MobileToggle />
          <MobileMenu />
        </div>
      </nav>
    );
  }

  // ─── minimal: just logo and hamburger menu, even on desktop ───
  if (layout === 'minimal') {
    return (
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${chrome.bar}`}
      >
        <div className="relative max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Brand />
          <MobileToggle />
          <MobileMenu />
        </div>
      </nav>
    );
  }

  // ─── classic-reversed: Links + CTA left, Logo right ───
  if (layout === 'classic-reversed') {
    return (
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${chrome.bar}`}>
        <div className="relative max-w-7xl mx-auto px-6 flex items-center justify-between flex-row-reverse">
          <Brand />
          <div className="hidden md:flex items-center gap-8 flex-row-reverse">
            <NavItems />
            <CtaButton />
          </div>
          <MobileToggle />
          <MobileMenu />
        </div>
      </nav>
    );
  }

  // ─── bottom-floating: pill bar fixed at the bottom of the screen ───
  if (layout === 'bottom-floating') {
    return (
      <nav className="fixed bottom-4 left-4 right-4 z-50">
        <div
          className={`relative max-w-7xl mx-auto px-6 py-4 flex items-center justify-between rounded-2xl transition-all duration-300 ${chrome.bar} rounded-2xl shadow-2xl shadow-black/20`}
        >
          <Brand />
          <div className="hidden md:flex items-center gap-8">
            <NavItems />
            <CtaButton />
          </div>
          <MobileToggle />
          {mobileOpen && (
             <div className={`md:hidden absolute bottom-full mb-3 left-0 right-0 rounded-2xl p-6 flex flex-col items-start gap-4 shadow-xl ${chrome.bar}`}>
               {visibleLinks.map((link, i) => (
                 <Link key={i} href={link.slug} onClick={() => setMobileOpen(false)} className={`text-base tracking-widest font-medium ${chrome.link}`}>
                   {link.label}
                 </Link>
               ))}
               <Link href="/#quote" onClick={() => setMobileOpen(false)} className={`mt-1 px-6 py-2 text-xs uppercase tracking-widest font-bold rounded-full border border-transparent ${chrome.ctaFilled}`}>
                 {ctaLabel}
               </Link>
             </div>
          )}
        </div>
      </nav>
    );
  }

  // ─── sidebar-left: vertical left navigation ───
  if (layout === 'sidebar-left') {
    return (
      <>
        {/* Mobile top bar (since sidebar takes too much space on mobile) */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50">
           <nav className={`transition-all duration-300 ${chrome.bar}`}>
            <div className="px-6 flex items-center justify-between">
              <Brand />
              <MobileToggle />
              <MobileMenu />
            </div>
          </nav>
        </div>
        {/* Desktop Sidebar */}
        <nav className={`hidden md:flex fixed top-0 left-0 bottom-0 w-64 z-50 flex-col py-10 px-8 transition-all duration-300 ${chrome.bar.replace('border-b', 'border-r').replace('py-4', '').replace('py-5', '').replace('py-6', '')}`}>
          <div className="mb-12">
            <Brand />
          </div>
          <div className="flex flex-col gap-6 flex-1">
            <NavItems />
          </div>
          <div className="mt-8">
            <CtaButton filled />
          </div>
        </nav>
      </>
    );
  }

  // ─── mega-centered: Logo center, links split evenly left and right ───
  if (layout === 'mega-centered') {
    const leftLinks = visibleLinks.slice(0, Math.ceil(visibleLinks.length / 2));
    const rightLinks = visibleLinks.slice(Math.ceil(visibleLinks.length / 2));
    return (
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${chrome.bar}`}>
        <div className="relative max-w-7xl mx-auto px-6 flex items-center justify-between md:grid md:grid-cols-3 md:gap-4">
          <div className="hidden md:flex items-center gap-8 justify-end">
            {leftLinks.map((link, i) => (
              <Link key={i} href={link.slug} className={`group relative text-sm tracking-widest transition-colors font-medium ${chrome.link} ${chrome.linkShadow}`}>{link.label}</Link>
            ))}
          </div>
          <div className="flex justify-start md:justify-center">
            <Brand />
          </div>
          <div className="hidden md:flex items-center gap-8 justify-start">
            {rightLinks.map((link, i) => (
              <Link key={i} href={link.slug} className={`group relative text-sm tracking-widest transition-colors font-medium ${chrome.link} ${chrome.linkShadow}`}>{link.label}</Link>
            ))}
            <CtaButton />
          </div>
          <div className="md:hidden">
            <MobileToggle />
            <MobileMenu />
          </div>
        </div>
      </nav>
    );
  }

  // ─── two-tier-topbar: thin utility bar above the classic main row ───
  if (layout === 'two-tier-topbar') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className={`w-full text-xs tracking-wide py-1.5 ${chrome.topbar}`}>
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-end gap-2">
            {phone ? <span>Call now: {phone}</span> : <span>Free estimates — book today</span>}
          </div>
        </div>
        <nav className={`transition-all duration-300 ${chrome.bar}`}>
          <div className="relative max-w-7xl mx-auto px-6 flex items-center justify-between">
            <Brand />
            <div className="hidden md:flex items-center gap-8">
              <NavItems />
              <CtaButton />
            </div>
            <MobileToggle />
            <MobileMenu />
          </div>
        </nav>
      </div>
    );
  }

  // ─── classic (default): logo left, links + CTA right, single row ───
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${chrome.bar}`}>
      <div className="relative max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Brand />
        <div className="hidden md:flex items-center gap-8">
          <NavItems />
          <CtaButton />
        </div>
        <MobileToggle />
        <MobileMenu />
      </div>
    </nav>
  );
}

