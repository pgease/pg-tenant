import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OnboardingCarouselProps {
  onComplete: () => void;
}

interface SlideData {
  src: string;
  title: string;
  subtitle: string;
  alt: string;
}

const TENANT_SLIDES: SlideData[] = [
  {
    src: '/slides/slide-2.jpg',
    title: 'Feel at home',
    subtitle: 'Your room and PG details, always handy.',
    alt: 'Feel at home slide',
  },
  {
    src: '/slides/slide-1.jpg',
    title: 'Rent made simple',
    subtitle: 'Pay rent and view your payment history.',
    alt: 'Rent made simple slide',
  },
  {
    src: '/slides/slide-3.jpg',
    title: 'Stay connected',
    subtitle: 'Raise complaints and receive PG updates.',
    alt: 'Stay connected slide',
  },
];

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const startX = useRef<number | null>(null);
  const currentX = useRef<number | null>(null);

  const finishOnboarding = (targetPath?: string) => {
    localStorage.setItem('pgease_onboarding_completed', 'true');
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
    if (diff > 40 && currentSlide < TENANT_SLIDES.length - 1) {
      nextSlide();
    } else if (diff < -40 && currentSlide > 0) {
      prevSlide();
    }
    startX.current = null;
    currentX.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#00382e] flex items-center justify-center overflow-hidden">
      <div
        className="relative w-full h-[100dvh] max-w-md mx-auto bg-[#004d40] flex flex-col justify-between overflow-hidden sm:rounded-3xl sm:h-[92dvh] sm:shadow-2xl sm:border sm:border-white/10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
      >
        {/* Floating Top Bar */}
        <div
          className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-5 pt-4 pb-2"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-2 rounded-full bg-black/35 backdrop-blur-md px-3 py-1.5 border border-white/15">
            <div className="h-4 w-4 rounded bg-primary flex items-center justify-center text-white text-[9px] font-bold">
              PG
            </div>
            <span className="text-[11px] font-bold tracking-wider text-white uppercase">PG Ease</span>
          </div>

          <button
            type="button"
            onClick={() => finishOnboarding('/login')}
            className="rounded-full bg-black/40 hover:bg-black/60 active:scale-95 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-white border border-white/20 shadow-sm transition-all"
          >
            Skip
          </button>
        </div>

        {/* Slides Track */}
        <div className="relative flex-1 w-full h-full overflow-hidden">
          <div
            className="flex h-full w-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {TENANT_SLIDES.map((slide) => (
              <div
                key={slide.title}
                className="relative h-full w-full shrink-0 basis-full flex items-center justify-center overflow-hidden select-none bg-[#004d40]"
              >
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Floating Bottom Navigation & Controls */}
        <div
          className="absolute bottom-0 inset-x-0 z-30 flex flex-col items-center gap-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-6 px-6"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
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
                    i === currentSlide ? 'w-7 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-2.5">
            {currentSlide < TENANT_SLIDES.length - 1 ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => finishOnboarding('/login')}
                  className="flex-1 py-3 text-white/80 hover:text-white text-sm font-semibold text-center transition-colors"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="flex-[1.5] py-3.5 px-5 rounded-full bg-white text-[#004d40] font-bold text-sm shadow-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => finishOnboarding('/login')}
                  className="w-full py-4 rounded-full bg-white text-[#004d40] font-extrabold text-base shadow-2xl hover:bg-gray-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => finishOnboarding('/search')}
                  className="w-full py-2 text-white/90 hover:text-white text-xs font-medium text-center transition-colors"
                >
                  Looking for a room? <span className="underline font-bold text-white">Explore PGs</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
