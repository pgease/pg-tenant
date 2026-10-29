import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Home, Building2, Menu } from 'lucide-react';

export const BottomTabBar: React.FC = () => {
  // Always the consistent 4 tabs matching Screenshot 2 & 3:
  // Dashboard | PG Search | My PG | Menu
  const tabs = [
    { path: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
    { path: '/search', label: 'PG Search', icon: Home },
    { path: '/my-pg', label: 'My PG', icon: Building2 },
    { path: '/profile', label: 'Menu', icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md border-t border-gray-100 bg-white/95 backdrop-blur-md pb-safe shadow-tab-bar">
      <div className="flex items-center justify-around px-2 pt-2 pb-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center py-1 transition-all tap-target ${
                  isActive
                    ? 'text-[#008080] font-bold'
                    : 'text-gray-400 hover:text-gray-600 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative flex items-center justify-center">
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 1.8} />
                  </div>
                  <span className="mt-1 text-[10px] tracking-tight">{tab.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
