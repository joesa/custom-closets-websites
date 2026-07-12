'use client';

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import * as motion from 'framer-motion/client';
import { ThemeType } from '@/types/config';
import type { QuizConfig } from '@/types/config';
import { getThemeStyles, getSectionTokens, applyVoice, ThemeTokenSelection } from '@/lib/theme';
import { useMotionHydrated } from '@/components/MotionHydrationProvider';
import { motionInitial } from '@/lib/motionInitial';

interface QuizSectionProps {
  theme: ThemeType;
  themeTokens?: ThemeTokenSelection | null;
  /** AI-generated, industry-specific quiz. When absent/empty, section is hidden. */
  quizConfig?: QuizConfig | null;
  onComplete: (answers: Record<string, string>) => void;
  fontSeed?: string;
  engagementModel?: string;
}

export default function QuizSection({ theme, themeTokens, quizConfig, onComplete, fontSeed, engagementModel }: QuizSectionProps) {
  const motionReady = useMotionHydrated();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);

  const QUESTIONS = quizConfig?.questions?.length ? quizConfig.questions : [];
  const hasQuiz = QUESTIONS.length > 0;
  const eyebrowText = quizConfig?.eyebrow?.trim() || 'Quick questions';
  const headlineText = quizConfig?.headline?.trim() || 'A few details help us help you.';

  const t = applyVoice(getThemeStyles(theme, themeTokens), theme, fontSeed ?? '', themeTokens);
  const section = getSectionTokens(theme, fontSeed ?? '', themeTokens);

  const activeStyles = {
    bg: t.pageBackground,
    title: `${t.headingFont} ${t.textPrimary}`,
    subtitle: `${t.bodyFont} ${section.accent} text-sm`,
    card: `${section.surface} ${section.surfaceBorder} ${t.textSecondary} hover:opacity-100 opacity-90`,
    selectedCard: `${section.accentBg} ${section.accentText} border-transparent`,
    button: t.button,
  };

  const handleSelect = (optionId: string) => {
    if (!hasQuiz) return;
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

  if (!hasQuiz) {
    return null;
  }

  return (
    <section className={`py-20 px-6 ${activeStyles.bg}`}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h3 className={`mb-4 ${activeStyles.subtitle}`}>{eyebrowText}</h3>
          <h2 className={`text-3xl md:text-5xl mb-6 ${activeStyles.title}`}>
            {isFinished ? 'Thanks — that helps.' : headlineText}
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
                initial={motionInitial(motionReady, { opacity: 0, x: 20 })}
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
                initial={motionInitial(motionReady, { opacity: 0, scale: 0.95 })}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 w-full flex flex-col items-center justify-center text-center"
              >
                <p className={`text-xl mb-8 ${t.bodyFont} ${t.textSecondary}`}>
                  {engagementModel === 'booking'
                    ? 'Next, pick a time that works for you.'
                    : engagementModel === 'order'
                      ? 'Next, browse the menu and place your order.'
                      : engagementModel === 'ticket'
                        ? 'Next, grab your tickets below.'
                        : 'Next, tell us a bit more so we can estimate your project.'}
                </p>
                <a 
                  href="#quote" 
                  className={`inline-block py-4 px-8 text-lg ${activeStyles.button}`}
                >
                  {engagementModel === 'booking'
                    ? 'Book Your Appointment'
                    : engagementModel === 'order'
                      ? 'Order Now'
                      : engagementModel === 'ticket'
                        ? 'Get Tickets'
                        : 'Continue to estimate'}
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
