import React from 'react';
import { NavLink } from 'react-router-dom';
import { tabItems } from '../../navigation/appMenu';

export const BottomTabBar: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md border-t border-gray-100 bg-white/95 backdrop-blur-md pb-safe shadow-tab-bar lg:hidden">
      <div className="flex items-stretch justify-around px-1 pt-1">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center px-0.5 py-1 ${
                  isActive ? 'text-[#008080] font-bold' : 'text-gray-400 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-7 w-10 items-center justify-center rounded-full transition-colors ${
                      isActive ? 'bg-[#E6F3F3]' : ''
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
