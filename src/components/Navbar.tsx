"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getThemeStyles } from '@/lib/theme';
import { NavLink, ThemeType } from '@/types/config';

interface NavbarProps {
  brandName: string;
  links: NavLink[];
  themeName: ThemeType;
}

export default function Navbar({ brandName, links, themeName }: NavbarProps) {
  const theme = getThemeStyles(themeName);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-black/90 backdrop-blur-md border-b border-white/10 py-4 shadow-2xl' 
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className={`text-xl font-bold tracking-wider text-white ${theme.headingFont}`}>
          {brandName}
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {links.map((link, i) => (
            <Link 
              key={i} 
              href={link.slug} 
              className={`text-sm tracking-widest text-white/80 hover:text-white transition-colors font-medium`}
            >
              {link.label}
            </Link>
          ))}
          <a href="/#quote" className={`ml-4 px-6 py-2 text-xs uppercase tracking-widest font-bold border border-white/30 text-white hover:bg-white hover:text-black transition-all ${theme.button.includes('rounded-none') ? 'rounded-none' : 'rounded-full'}`}>
            Get Quote
          </a>
        </div>
      </div>
    </nav>
  );
}
