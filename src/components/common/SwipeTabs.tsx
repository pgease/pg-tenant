import React, { useRef, useState } from 'react';

export function SwipeTabs<T extends string>({
  tabs,
  value,
  onChange,
  children,
  className = '',
}: {
  tabs: Array<{ id: T; label: string; badge?: number }>;
  value: T;
  onChange: (id: T) => void;
  children?: React.ReactNode;
  className?: string;
}) {
  const activeIndex = Math.max(0, tabs.findIndex((t) => t.id === value));
  const equalGrid = tabs.length > 0 && tabs.length <= 4;

  const gestureRef = useRef<{
    startX: number;
    startY: number;
    lock: 'horizontal' | 'vertical' | null;
    edgeSkip: boolean;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!children || tabs.length <= 1 || e.touches.length !== 1) return;
    const t = e.touches[0];
    gestureRef.current = {
      startX: t.clientX,
      startY: t.clientY,
      lock: null,
      edgeSkip: t.clientX < 28,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const g = gestureRef.current;
    if (!g || g.edgeSkip || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - g.startX;
    const dy = t.clientY - g.startY;
    if (!g.lock) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        g.lock = 'vertical';
        return;
      }
      if (Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.35) {
        g.lock = 'horizontal';
      }
    }
    if (g.lock === 'horizontal') {
      setDragOffset(Math.max(-44, Math.min(44, dx * 0.35)));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const g = gestureRef.current;
    gestureRef.current = null;
    setDragOffset(0);
    if (!g || g.edgeSkip || g.lock !== 'horizontal') return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - g.startX;
    if (Math.abs(dx) < 48) return;
    if (dx < 0 && activeIndex < tabs.length - 1) {
      onChange(tabs[activeIndex + 1].id);
    } else if (dx > 0 && activeIndex > 0) {
      onChange(tabs[activeIndex - 1].id);
    }
  };

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        className={`relative p-1 rounded-2xl bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-slate-700 ${
          equalGrid ? 'grid' : 'flex items-center gap-1.5 overflow-x-auto'
        } ${className}`}
        style={equalGrid ? { gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` } : undefined}
      >
        {equalGrid && tabs.length > 0 && (
          <div
            aria-hidden="true"
            className="absolute top-1 bottom-1 left-1 rounded-xl bg-[#008080] shadow-sm transition-transform duration-200 ease-out pointer-events-none"
            style={{
              width: `calc((100% - 8px) / ${tabs.length})`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        )}
        {tabs.map((tab) => {
          const active = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={`relative z-10 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium min-h-[40px] transition-colors cursor-pointer ${
                !equalGrid ? 'shrink-0 px-3.5' : ''
              } ${
                active
                  ? equalGrid
                    ? 'text-white font-semibold'
                    : 'bg-[#008080] text-white font-semibold shadow-sm'
                  : 'text-gray-600 dark:text-slate-300'
              }`}
            >
              <span className="truncate">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none shrink-0 ${
                    active ? 'bg-white/20 text-white' : 'bg-teal-50 text-[#008080] dark:bg-teal-950 dark:text-teal-300'
                  }`}
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {children !== undefined && (
        <div
          className="transition-transform duration-150 ease-out"
          style={dragOffset ? { transform: `translateX(${dragOffset}px)` } : undefined}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {children}
        </div>
      )}
    </div>
  );
}
