'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeType } from '@/types/config';
import { getThemeStyles, getSectionTokens } from '@/lib/theme';

interface QuizSectionProps {
  theme: ThemeType;
  onComplete: (answers: Record<string, string>) => void;
}

const QUESTIONS = [
  {
    id: 'frustration',
    title: "What's the biggest issue with your current space?",
    options: [
      { id: 'clutter', label: "Too much clutter, no organization" },
      { id: 'aesthetic', label: "It looks outdated and messy" },
      { id: 'space', label: "I need to maximize a small space" },
      { id: 'flow', label: "The layout doesn't work for me" }
    ]
  },
  {
    id: 'style',
    title: "How do you want your new space to feel?",
    options: [
      { id: 'luxurious', label: "Luxurious & Boutique-like" },
      { id: 'minimal', label: "Clean, Minimal, & Hidden" },
      { id: 'warm', label: "Warm, Classic, & Inviting" },
      { id: 'industrial', label: "Bold, Durable, & Functional" }
    ]
  },
  {
    id: 'timeline',
    title: "When are you looking to start your project?",
    options: [
      { id: 'asap', label: "Immediately" },
      { id: '1month', label: "Within 30 Days" },
      { id: '3months', label: "Within 3 Months" },
      { id: 'exploring', label: "Just Exploring" }
    ]
  }
];

export default function QuizSection({ theme, onComplete }: QuizSectionProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);

  // Derive styling from the central theme tokens so every theme renders
  // correctly rather than falling back to the luxury-minimal palette.
  const t = getThemeStyles(theme);
  const section = getSectionTokens(theme);

  const activeStyles = {
    bg: t.pageBackground,
    title: `${t.headingFont} ${t.textPrimary}`,
    subtitle: `${t.bodyFont} ${section.accent} tracking-widest uppercase text-sm`,
    card: `${section.surface} ${section.surfaceBorder} ${t.textSecondary} hover:opacity-100 opacity-90`,
    selectedCard: `${section.accentBg} ${section.accentText} border-transparent`,
    button: t.button,
  };

  const handleSelect = (optionId: string) => {
    const questionId = QUESTIONS[currentStep].id;
    const newAnswers = { ...answers, [questionId]: optionId };
    setAnswers(newAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 300);
    } else {
      setTimeout(() => {
        setIsFinished(true);
        onComplete(newAnswers);
      }, 400);
    }
  };

  return (
    <section className={`py-24 px-6 ${activeStyles.bg}`}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h3 className={`mb-4 ${activeStyles.subtitle}`}>Design Your Space</h3>
          <h2 className={`text-3xl md:text-5xl mb-6 ${activeStyles.title}`}>
            {isFinished ? "Perfect! We have what we need." : "Take our 3-question AI design quiz."}
          </h2>
          {!isFinished && (
            <div className="flex justify-center gap-2 mb-8">
              {QUESTIONS.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 w-12 transition-all duration-300 ${idx <= currentStep ? section.accentBg : (section.isDark ? 'bg-white/15' : 'bg-black/10')}`} 
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative min-h-[300px]">
          <AnimatePresence mode="wait">
            {!isFinished ? (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 w-full"
              >
                <h4 className={`text-2xl text-center mb-8 ${activeStyles.title}`}>
                  {QUESTIONS[currentStep].title}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {QUESTIONS[currentStep].options.map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleSelect(option.id)}
                      className={`p-6 border text-left transition-all duration-200 cursor-pointer ${
                        answers[QUESTIONS[currentStep].id] === option.id 
                          ? activeStyles.selectedCard 
                          : activeStyles.card
                      }`}
                    >
                      <span className="font-semibold">{option.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="finished"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 w-full flex flex-col items-center justify-center text-center"
              >
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-green-500/10 text-green-600">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <p className={`text-xl mb-8 ${t.bodyFont} ${t.textSecondary}`}>
                  Your design profile has been pre-loaded into the quoting engine.
                </p>
                <a 
                  href="#quote" 
                  className={`inline-block py-4 px-8 text-lg ${activeStyles.button}`}
                >
                  Get Your Instant Quote
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
