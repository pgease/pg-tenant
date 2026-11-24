import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hideSplashScreen } from '../../utils/appBridge';

interface OnboardingCarouselProps {
  onComplete: () => void;
}

interface SlideData {
  imageWebp: string;
  imagePng: string;
  title: string;
  subtitle: string;
}

const TENANT_SLIDES: SlideData[] = [
  {
    imageWebp: '/onboarding/onboarding-1.webp',
    imagePng: '/onboarding/onboarding-1.png',
    title: 'Your PG, in your pocket',
    subtitle: 'Room details, notices and food menu in one place.',
  },
  {
    imageWebp: '/onboarding/onboarding-2.webp',
    imagePng: '/onboarding/onboarding-2.png',
    title: 'Pay rent in seconds',
    subtitle: 'Pay online or submit UPI proof, and get instant receipts.',
  },
  {
    imageWebp: '/onboarding/onboarding-3.webp',
    imagePng: '/onboarding/onboarding-3.png',
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
    <div className="fixed inset-0 z-50 bg-[#FFFFFF] flex items-center justify-center select-none overflow-hidden font-poppins">
      <div
        className="relative w-full h-[100dvh] max-w-md mx-auto bg-[#FFFFFF] flex flex-col justify-between overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
      >
        {/* Top Floating Bar with Skip (hidden on slide 3) */}
        <div
          className="absolute top-0 inset-x-0 z-30 flex items-center justify-end px-6 pt-4 pb-2"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          {!isLast && (
            <button
              type="button"
              onClick={() => finishOnboarding('/login')}
              className="w-[58px] h-[30px] rounded-[15px] bg-[#EEF5F5] hover:bg-[#E0ECEC] active:scale-95 text-[14px] font-medium text-[#008080] flex items-center justify-center transition-all"
            >
              Skip
            </button>
          )}
        </div>

        {/* Slides Track */}
        <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col justify-between pt-12 pb-32">
          <div
            className="flex h-full w-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {TENANT_SLIDES.map((slide) => (
              <div
                key={slide.title}
                className="relative h-full w-full shrink-0 basis-full flex flex-col items-center justify-between px-6 pt-2 pb-2 select-none"
              >
                {/* Top: Custom Vector Illustration */}
                <div className="w-full flex-1 max-h-[48vh] sm:max-h-[50vh] flex items-center justify-center min-h-[160px]">
                  <picture>
                    <source srcSet={slide.imageWebp} type="image/webp" />
                    <img
                      src={slide.imagePng}
                      alt={slide.title}
                      className="w-full h-full max-h-[320px] aspect-[1080/900] object-contain pointer-events-none"
                      draggable={false}
                    />
                  </picture>
                </div>

                {/* Middle: Title & Subtitle */}
                <div className="w-full text-center mt-3 mb-2 px-2 flex flex-col items-center">
                  <h2
                    className="text-[24px] font-semibold text-[#1F2937] leading-[34px] tracking-tight max-w-[320px]"
                    style={{ textWrap: 'balance' as any }}
                  >
                    {slide.title}
                  </h2>
                  <p className="mt-2 text-[15px] font-normal text-[#6B7280] leading-[24px] max-w-[290px]">
                    {slide.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation & Controls */}
        <div
          className="absolute bottom-0 inset-x-0 z-30 flex flex-col items-center gap-5 bg-white pt-2 pb-6 px-6"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {/* Pagination Dots (Active 24x8 teal pill, Inactive 8x8 #CFD8DC, gap 8) */}
          <div className="flex items-center gap-2">
            {TENANT_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentSlide(i)}
                className="focus:outline-none"
                aria-label={`Go to slide ${i + 1}`}
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 ${
                    i === currentSlide ? 'w-[24px] bg-[#008080]' : 'w-[8px] bg-[#CFD8DC]'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Primary Action Button (52dp height, radius 14, #008080, Poppins SemiBold 16) */}
          <div className="w-full">
            <button
              type="button"
              onClick={nextSlide}
              className="w-full h-[52px] rounded-[14px] bg-[#008080] hover:bg-[#006e6e] active:scale-[0.98] text-white font-semibold text-[16px] shadow-sm flex items-center justify-center transition-all"
            >
              {isLast ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
