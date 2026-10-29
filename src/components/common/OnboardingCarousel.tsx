import React, { useState } from 'react';
import { ShieldCheck, CreditCard, Home, ArrowRight, Check } from 'lucide-react';

interface OnboardingCarouselProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    id: 1,
    title: 'Find Verified PGs & Hostels',
    description: 'Explore top-rated, genuine PGs near your college or office with transparent pricing and real photos.',
    icon: Home,
    accentBg: 'bg-teal-50',
    iconColor: 'text-primary',
  },
  {
    id: 2,
    title: 'Easy Rent Payments',
    description: 'Pay monthly rent securely via UPI or Card, upload UTRs, and download official receipts instantly.',
    icon: CreditCard,
    accentBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    id: 3,
    title: 'Smart In-Stay Living',
    description: 'Check daily food menus, view WiFi passwords, raise maintenance tickets, and track notice periods.',
    icon: ShieldCheck,
    accentBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
];

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem('pgease_onboarding_completed', 'true');
    onComplete();
  };

  const slide = SLIDES[currentSlide];
  const IconComponent = slide.icon;

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-between bg-white px-6 py-10 pb-safe pt-safe">
      {/* Top Bar with Skip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-bold">
            PG
          </div>
          <span className="font-bold text-brandText tracking-tight">PG Ease</span>
        </div>

        {currentSlide < SLIDES.length - 1 ? (
          <button
            onClick={finishOnboarding}
            className="text-sm font-semibold text-brandText-muted hover:text-brandText tap-target flex items-center"
          >
            Skip
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* Slide Illustration & Content */}
      <div className="my-auto flex flex-col items-center text-center">
        <div
          className={`relative mb-8 flex h-40 w-40 items-center justify-center rounded-3xl ${slide.accentBg} transition-transform duration-300 hover:scale-105`}
        >
          <IconComponent className={`h-20 w-20 ${slide.iconColor}`} strokeWidth={1.75} />
          <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-brandText shadow-md">
            <Check className="h-4 w-4 stroke-[3]" />
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-brandText sm:text-3xl">
          {slide.title}
        </h2>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-brandText-muted">
          {slide.description}
        </p>

        {/* Indicators */}
        <div className="mt-8 flex items-center gap-2">
          {SLIDES.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="w-full">
        <button
          onClick={handleNext}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all active:scale-[0.98] hover:bg-primary-dark tap-target"
        >
          <span>{currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
