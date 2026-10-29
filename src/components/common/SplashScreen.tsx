import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  durationMs = 1500,
}) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, durationMs - 300);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, durationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [durationMs, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-white px-6 py-12 transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div />

      <div className="flex flex-col items-center">
        {/* Animated Brand Icon */}
        <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-primary shadow-xl shadow-primary/20 animate-pulse">
          <div className="flex items-center justify-center">
            <span className="text-4xl font-extrabold tracking-tight text-white">PG</span>
            <span className="text-4xl font-extrabold tracking-tight text-accent">Ease</span>
          </div>
        </div>

        <h1 className="mt-6 text-3xl font-extrabold text-brandText tracking-tight">
          PG <span className="text-primary">Ease</span>
        </h1>
        <p className="mt-1 text-sm font-medium text-brandText-muted">
          Your Home Away From Home
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-primary-50">
          <div className="h-full w-full bg-primary animate-pulse" />
        </div>
        <p className="text-xs text-brandText-light font-medium">Tenant Portal</p>
      </div>
    </div>
  );
};
