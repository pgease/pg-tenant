import React from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, LayoutGrid, Menu, Search } from 'lucide-react';

const FIGMA_TABS = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/search', label: 'PG Search', icon: Search },
  { to: '/my-pg', label: 'My PG', icon: Building2 },
  { to: '/profile', label: 'Menu', icon: Menu },
];

function triggerLightHaptic() {
  try {
    const haptics = (window as any).Capacitor?.Plugins?.Haptics;
    if (haptics?.impact) void haptics.impact({ style: 'LIGHT' });
  } catch {
    // ignore
  }
}

export const BottomTabBar: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto w-full border-t border-[var(--ms-border)] bg-[var(--ms-card)]/95 backdrop-blur-md pb-safe shadow-tab-bar lg:hidden">
      <div className="flex items-stretch justify-around px-1 pt-1 max-w-lg mx-auto">
        {FIGMA_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              onClick={triggerLightHaptic}
              className={({ isActive }) =>
                `flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center px-0.5 py-1 transition-colors ${
                  isActive ? 'text-[var(--ms-brand)] font-semibold' : 'text-[var(--ms-ink-3)] font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-7 w-10 items-center justify-center rounded-full transition-colors ${
                      isActive ? 'bg-[var(--ms-brand-50)]' : ''
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 1.8} />
                  </span>
                  <span className="mt-0.5 w-full truncate text-center text-[10px] leading-tight tracking-tight">
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
