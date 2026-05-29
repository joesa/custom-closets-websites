'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Product, ThemeType } from '@/types/config';

interface ProductDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  theme: ThemeType;
}

export default function ProductDetailSheet({ isOpen, onClose, product, theme }: ProductDetailSheetProps) {
  if (!product) return null;

  const styles: Record<string, any> = {
    'luxury-minimal': {
      panelBg: 'bg-white',
      textMain: 'text-stone-900 font-playfair tracking-wide',
      textSub: 'text-stone-500 font-sans font-light',
      specBg: 'bg-stone-50 border border-stone-100',
      closeBtn: 'text-stone-400 hover:text-stone-900 font-sans'
    },
    'brutalist': {
      panelBg: 'bg-[#050505] border-l border-white/10',
      textMain: 'text-white font-inter font-black uppercase tracking-tighter',
      textSub: 'text-slate-400 font-sans text-sm',
      specBg: 'bg-white/5 border border-white/10 font-sans text-sm',
      closeBtn: 'text-yellow-400 hover:text-white font-inter uppercase font-bold'
    },
    'classic-warm': {
      panelBg: 'bg-[#faf8f5] border-l border-amber-900/10',
      textMain: 'text-amber-950 font-lora',
      textSub: 'text-amber-900/70 font-sans',
      specBg: 'bg-white rounded-xl border border-amber-900/5',
      closeBtn: 'text-amber-900/50 hover:text-amber-900 font-sans font-medium'
    }
  };

  const activeStyles = styles[theme] || styles['luxury-minimal'];

  const details = product.details || {
    subtitle: "Premium Design Line",
    longDescription: product.description,
    specifications: ["Bespoke spatial sizing", "Professional premium fabrication", "Fully managed execution"]
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 cursor-pointer"
          />

          {/* Slide-out Sidebar Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed right-0 top-0 h-full w-full max-w-xl shadow-2xl z-50 overflow-y-auto p-8 md:p-12 ${activeStyles.panelBg}`}
          >
            <div className="flex justify-between items-start mb-12">
              <div>
                <span className={`text-xs uppercase tracking-widest opacity-60 block mb-2 ${activeStyles.textSub}`}>
                  {details.subtitle}
                </span>
                <h3 className={`text-3xl md:text-4xl leading-tight ${activeStyles.textMain}`}>
                  {product.title}
                </h3>
              </div>
              <button onClick={onClose} className={`text-xs tracking-widest uppercase transition-colors pt-2 ${activeStyles.closeBtn}`}>
                Close ✕
              </button>
            </div>

            {/* High-Resolution Concept Asset Window */}
            <div className="relative aspect-[4/3] w-full mb-12 overflow-hidden rounded-sm group shadow-sm">
              <Image
                src={product.image}
                alt={product.title}
                fill
                priority
                className="object-cover"
              />
            </div>

            {/* Core Narrative Text Block */}
            <div className="mb-12">
              <h4 className={`text-sm uppercase tracking-widest mb-4 opacity-80 ${activeStyles.textMain}`}>
                The Architectural Vision
              </h4>
              <p className={`${activeStyles.textSub} leading-relaxed text-lg`}>
                {details.longDescription}
              </p>
            </div>

            {/* Structural Material Spec Box */}
            <div>
              <h4 className={`text-sm uppercase tracking-widest mb-4 opacity-80 ${activeStyles.textMain}`}>
                System Specifications
              </h4>
              <ul className="space-y-3">
                {details.specifications.map((spec, index) => (
                  <li key={index} className={`p-5 text-sm ${activeStyles.specBg} ${activeStyles.textSub} leading-relaxed`}>
                    {spec}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
