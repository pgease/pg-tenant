import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { hideSplashScreen } from '../../utils/appBridge';

interface OnboardingCarouselProps {
  onComplete: () => void;
}

interface SlideData {
  svg: string;
  fallback: string;
  title: string;
  subtitle: string;
}

const TENANT_SLIDES: SlideData[] = [
  {
    svg: '/slides/slide-1.svg',
    fallback: '/slides/slide-1.jpg',
    title: 'Your PG, in your pocket',
    subtitle: 'Room details, notices and food menu in one place.',
  },
  {
    svg: '/slides/slide-2.svg',
    fallback: '/slides/slide-2.jpg',
    title: 'Pay rent in seconds',
    subtitle: 'Pay online or submit UPI proof, and get instant receipts.',
  },
  {
    svg: '/slides/slide-3.svg',
    fallback: '/slides/slide-3.jpg',
    title: 'Raise requests easily',
    subtitle: 'Complaints, night out and guest passes in a few taps.',
  },
];

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const startX = useRef<number | null>(null);
  const currentX = useRef<number | null>(null);

  // Hide native splash screen once React mounts
  useEffect(() => {
    hideSplashScreen();
  }, []);

  const finishOnboarding = (targetPath?: string) => {
    localStorage.setItem('pgease_onboarding_completed', 'true');
    localStorage.setItem('pgease_onboarding_carousel_seen', '1');
    onComplete();
    if (targetPath) {
      navigate(targetPath);
    }
  };

  const nextSlide = () => {
    if (currentSlide < TENANT_SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      finishOnboarding('/login');
    }
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentSlide((prev) => Math.min(prev + 1, TENANT_SLIDES.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        finishOnboarding('/login');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Swipe handling
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startX.current = clientX;
    currentX.current = clientX;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (startX.current === null) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    currentX.current = clientX;
  };

  const handleTouchEnd = () => {
    if (startX.current === null || currentX.current === null) return;
    const diff = startX.current - currentX.current;
    if (diff > 45 && currentSlide < TENANT_SLIDES.length - 1) {
      nextSlide();
    } else if (diff < -45 && currentSlide > 0) {
      prevSlide();
    }
    startX.current = null;
    currentX.current = null;
  };

  const isLast = currentSlide === TENANT_SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-[#F9FAFB] flex items-center justify-center select-none overflow-hidden font-poppins">
      <div
        className="relative w-full h-[100dvh] max-w-md mx-auto bg-white flex flex-col justify-between overflow-hidden sm:rounded-3xl sm:h-[92dvh] sm:shadow-2xl sm:border sm:border-gray-100"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
      >
        {/* Top Floating Bar with Skip */}
        <div
          className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-6 pt-4 pb-2"
          style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-[#008080] flex items-center justify-center text-white text-[11px] font-bold">
              PG
            </div>
            <span className="text-xs font-bold tracking-wider text-[#1F2937] uppercase">PG Ease</span>
          </div>

          <button
            type="button"
            onClick={() => finishOnboarding('/login')}
            className="px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 text-xs font-semibold text-[#4B5563] transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Slides Track */}
        <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col justify-between pt-16 pb-28">
          <div
            className="flex h-full w-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {TENANT_SLIDES.map((slide) => (
              <div
                key={slide.title}
                className="relative h-full w-full shrink-0 basis-full flex flex-col items-center justify-between px-6 pt-4 pb-2 select-none"
              >
                {/* Top 50-55%: Custom Vector Illustration */}
                <div className="w-full flex-1 max-h-[52vh] flex items-center justify-center">
                  <img
                    src={slide.svg}
                    alt={slide.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = slide.fallback;
                    }}
                    className="w-full h-full max-h-[300px] object-contain pointer-events-none drop-shadow-sm"
                    draggable={false}
                  />
                </div>

                {/* Middle: Title & Subtitle */}
                <div className="w-full text-center mt-3 mb-2 px-2 flex flex-col items-center">
                  <h2 className="text-2xl font-semibold text-[#1F2937] tracking-tight leading-snug">
                    {slide.title}
                  </h2>
                  <p className="mt-2 text-sm font-normal text-[#4B5563] leading-relaxed max-w-xs">
                    {slide.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation & Controls */}
        <div
          className="absolute bottom-0 inset-x-0 z-30 flex flex-col items-center gap-5 bg-gradient-to-t from-white via-white/95 to-transparent pt-6 pb-6 px-6"
          style={{ paddingBottom: 'max(1.75rem, env(safe-area-inset-bottom))' }}
        >
          {/* Pagination Dots */}
          <div className="flex items-center gap-2">
            {TENANT_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentSlide(i)}
                className="p-1 focus:outline-none"
                aria-label={`Go to slide ${i + 1}`}
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 ${
                    i === currentSlide ? 'w-7 bg-[#008080]' : 'w-2 bg-gray-200 hover:bg-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Primary Action Button (Teal #008080, min 48dp target) */}
          <div className="w-full flex items-center gap-3">
            <button
              type="button"
              onClick={nextSlide}
              className="w-full h-[52px] rounded-2xl bg-[#008080] hover:bg-[#006e6e] active:scale-[0.98] text-white font-semibold text-base shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <span>{isLast ? 'Get Started' : 'Next'}</span>
              {isLast ? (
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
